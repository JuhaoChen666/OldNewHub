package com.oldnewhub.service;

import com.oldnewhub.entity.Item;
import com.oldnewhub.entity.Category;
import com.oldnewhub.entity.User;
import com.oldnewhub.repository.ItemRepository;
import com.oldnewhub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.oldnewhub.entity.ItemImage;
import com.oldnewhub.repository.ItemImageRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.ArrayList;

import org.springframework.transaction.annotation.Transactional;

@Service
public class ItemService {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ItemImageRepository itemImageRepository;

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    private Path getUploadDir() {
        String userDir = System.getProperty("user.dir");
        Path assetsRoot = Paths.get(userDir, "backend", "src", "main", "resources", "Assets");
        if (!Files.exists(assetsRoot)) {
            assetsRoot = Paths.get(userDir, "src", "main", "resources", "Assets");
        }
        if (!Files.exists(assetsRoot)) {
            assetsRoot = Paths.get("backend/src/main/resources/Assets").toAbsolutePath();
        }
        return assetsRoot;
    }

    public Item uploadItem(Item item, String username, MultipartFile[] images) {
        if (item.getTradeAddress() == null || item.getTradeAddress().isBlank()) {
            throw new RuntimeException("Trade address is required");
        }

        item.setTradeAddress(item.getTradeAddress().trim());

        User owner = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        item.setOwner(owner);
        item.setStatus(Item.Status.PENDING);
        Item savedItem = itemRepository.save(item);

        if (images != null && images.length > 0) {
            if (images.length > 3) {
                throw new RuntimeException("Maximum 3 images allowed");
            }
            
            java.util.List<String> allowedTypes = java.util.Arrays.asList("image/jpeg", "image/png", "image/webp", "image/jpg");

            for (MultipartFile file : images) {
                if (file.getSize() > 10 * 1024 * 1024) {
                    throw new RuntimeException("Image size must be less than 10MB");
                }
                
                String contentType = file.getContentType();
                if (contentType == null || !allowedTypes.contains(contentType.toLowerCase())) {
                    throw new RuntimeException("Unsupported file type: " + contentType + ". Only JPG, PNG, and WEBP are allowed.");
                }
                
                String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
                String relativePath = String.format("/api/files/%d/%d/%s", owner.getUserId(), savedItem.getItemId(), fileName);
                Path path = getUploadDir().resolve(String.valueOf(owner.getUserId())).resolve(String.valueOf(savedItem.getItemId()));
                
                try {
                    Files.createDirectories(path);
                    Files.copy(file.getInputStream(), path.resolve(fileName));
                    
                    ItemImage itemImage = new ItemImage();
                    itemImage.setImageUrl(relativePath);
                    itemImage.setItem(savedItem);
                    itemImageRepository.save(itemImage);
                    savedItem.getImages().add(itemImage);
                } catch (IOException e) {
                    throw new RuntimeException("Failed to store image", e);
                }
            }
        }
        return savedItem;
    }

    @Transactional(readOnly = true)
    public List<Item> getPublicItems(String keyword, Long categoryId) {
        if (keyword != null && !keyword.isEmpty()) {
            return itemRepository.findByTitleContainingAndStatus(keyword, Item.Status.APPROVED);
        }
        if (categoryId != null) {
            Category category = new Category();
            category.setCategoryId(categoryId);
            return itemRepository.findByCategoryAndStatus(category, Item.Status.APPROVED);
        }
        return itemRepository.findByStatus(Item.Status.APPROVED);
    }

    public Item updateStatus(Long itemId, Item.Status status, String username) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));

        // Check if owner or admin
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() != User.Role.ADMIN && !item.getOwner().getUsername().equals(username)) {
            throw new RuntimeException("Unauthorized: only the owner or an admin can update this item");
        }
        item.setStatus(status);
        return itemRepository.save(item);
    }

    @Transactional(readOnly = true)
    public List<Item> getMyItems(String username) {
        User owner = userRepository.findByUsername(username).orElseThrow();
        return itemRepository.findByOwner(owner);
    }

    public Item updatePrice(Long itemId, BigDecimal newPrice, String reason, String username) {
        if (newPrice == null || newPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Price must be greater than 0");
        }

        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));

        if (!item.getOwner().getUsername().equals(username)) {
            throw new RuntimeException("Unauthorized: only the owner can change the price");
        }

        boolean needsReview = item.isSignificantPriceChange(newPrice);
        if (needsReview) {
            if (reason == null || reason.isBlank()) {
                throw new RuntimeException("价格变动超过25%，必须提供改价理由");
            }
            item.setPriceChangeReason(reason.trim());
            item.setStatus(Item.Status.PENDING);
        }

        item.setPrice(newPrice);
        return itemRepository.save(item);
    }

    @Transactional(readOnly = true)
    public List<Item> getAllItemsForAdmin() {
        return itemRepository.findAll();
    }

    public Map<String, Long> getStatistics() {
        List<Item> items = itemRepository.findAll();
        return items.stream()
                .collect(Collectors.groupingBy(i -> i.getStatus().name(), Collectors.counting()));
    }

    public void sendBuyRequest(Long itemId, String message, String buyerUsername) {
        if (message == null || message.isBlank()) {
            throw new RuntimeException("Message content is required");
        }

        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        if (item.getStatus() != Item.Status.APPROVED) {
            throw new RuntimeException("Only approved items can receive buy requests");
        }

        User buyer = userRepository.findByUsername(buyerUsername)
                .orElseThrow(() -> new RuntimeException("Buyer not found"));
        User seller = item.getOwner();
        if (seller == null || seller.getEmail() == null || seller.getEmail().isBlank()) {
            throw new RuntimeException("Seller email is missing");
        }
        if (seller.getUsername().equals(buyerUsername)) {
            throw new RuntimeException("You cannot send a buy request for your own item");
        }

        String subject = "我对" + item.getTitle() + "很感兴趣，想约你校园线下交易";
        String body = "买家：" + buyer.getUsername() + "\n"
                + "买家邮箱：" + buyer.getEmail() + "\n"
                + "物品：" + item.getTitle() + "\n"
                + "价格：¥" + item.getPrice() + "\n"
                + "建议交易地址：" + item.getTradeAddress() + "\n\n"
                + message.trim();

        SimpleMailMessage mailMessage = new SimpleMailMessage();
        mailMessage.setTo(seller.getEmail());
        if (mailFrom != null && !mailFrom.isBlank()) {
            mailMessage.setFrom(mailFrom);
        }
        mailMessage.setSubject(subject);
        mailMessage.setText(body);
        mailSender.send(mailMessage);
    }
}
