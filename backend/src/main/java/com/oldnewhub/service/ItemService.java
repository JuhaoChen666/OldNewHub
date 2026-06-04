package com.oldnewhub.service;

import com.oldnewhub.entity.Item;
import com.oldnewhub.entity.Category;
import com.oldnewhub.entity.User;
import com.oldnewhub.repository.ItemRepository;
import com.oldnewhub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.oldnewhub.entity.ItemImage;
import com.oldnewhub.repository.ItemImageRepository;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.ArrayList;

@Service
public class ItemService {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ItemImageRepository itemImageRepository;

    private final String uploadDir = "backend/src/main/resources/Assets";

    public Item uploadItem(Item item, String username, MultipartFile[] images) {
        User owner = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        item.setOwner(owner);
        item.setStatus(Item.Status.PENDING);
        Item savedItem = itemRepository.save(item);

        if (images != null && images.length > 0) {
            if (images.length > 3) {
                throw new RuntimeException("Maximum 3 images allowed");
            }
            
            for (MultipartFile file : images) {
                if (file.getSize() > 10 * 1024 * 1024) {
                    throw new RuntimeException("Image size must be less than 10MB");
                }
                
                String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
                String relativePath = String.format("/Assets/%d/%d/%s", owner.getId(), savedItem.getId(), fileName);
                Path path = Paths.get(uploadDir, String.valueOf(owner.getId()), String.valueOf(savedItem.getId()));
                
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

    public List<Item> getPublicItems(String keyword, Long categoryId) {
        if (keyword != null && !keyword.isEmpty()) {
            return itemRepository.findByTitleContainingAndStatus(keyword, Item.Status.APPROVED);
        }
        // Simplified category filter logic
        return itemRepository.findByStatus(Item.Status.APPROVED);
    }

    public Item updateStatus(Long itemId, Item.Status status, String username) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        
        // Check if owner or admin
        User user = userRepository.findByUsername(username).orElseThrow();
        if (user.getRole() == User.Role.ADMIN || item.getOwner().getUsername().equals(username)) {
            item.setStatus(status);
            return itemRepository.save(item);
        }
        throw new RuntimeException("Unauthorized");
    }

    public List<Item> getMyItems(String username) {
        User owner = userRepository.findByUsername(username).orElseThrow();
        return itemRepository.findByOwner(owner);
    }

    public Item updatePrice(Long itemId, java.math.BigDecimal price, String username) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        if (item.getOwner().getUsername().equals(username)) {
            item.setPrice(price);
            return itemRepository.save(item);
        }
        throw new RuntimeException("Unauthorized");
    }

    public List<Item> getAllItemsForAdmin() {
        return itemRepository.findAll();
    }

    public Map<String, Long> getStatistics() {
        List<Item> items = itemRepository.findAll();
        return items.stream()
                .collect(Collectors.groupingBy(i -> i.getStatus().name(), Collectors.counting()));
    }
}
