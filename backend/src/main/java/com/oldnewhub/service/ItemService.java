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

@Service
public class ItemService {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private UserRepository userRepository;

    public Item uploadItem(Item item, String username) {
        User owner = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        item.setOwner(owner);
        item.setStatus(Item.Status.PENDING);
        return itemRepository.save(item);
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
