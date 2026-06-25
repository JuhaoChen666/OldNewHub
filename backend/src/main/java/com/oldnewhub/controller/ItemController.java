package com.oldnewhub.controller;

import com.oldnewhub.entity.Item;
import com.oldnewhub.service.ItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    @Autowired
    private ItemService itemService;

    // Public endpoints
    @GetMapping("/public/list")
    public List<Item> listPublicItems(@RequestParam(required = false) String keyword,
                                    @RequestParam(required = false) Long categoryId) {
        return itemService.getPublicItems(keyword, categoryId);
    }

    // Authenticated user endpoints
    @PostMapping(value = "/upload", consumes = {"multipart/form-data"})
    public Item upload(@RequestPart("item") String itemJson,
                      @RequestPart(value = "images", required = false) MultipartFile[] images,
                      Authentication auth) throws Exception {
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        mapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        Item item = mapper.readValue(itemJson, Item.class);
        return itemService.uploadItem(item, auth.getName(), images);
    }

    @GetMapping("/mine")
    public List<Item> myItems(Authentication auth) {
        return itemService.getMyItems(auth.getName());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam Item.Status status, Authentication auth) {
        try {
            return ResponseEntity.ok(itemService.updateStatus(id, status, auth.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/price")
    public ResponseEntity<?> updatePrice(@PathVariable Long id,
                                          @RequestParam java.math.BigDecimal price,
                                          @RequestParam(required = false) String reason,
                                          Authentication auth) {
        try {
            Item updated = itemService.updatePrice(id, price, reason, auth.getName());
            boolean needsReview = updated.getStatus() == Item.Status.PENDING &&
                                  updated.getPriceChangeReason() != null;
            return ResponseEntity.ok(Map.of(
                "item", updated,
                "needsReview", needsReview
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/buy-request")
    public ResponseEntity<?> sendBuyRequest(@PathVariable Long id,
                                            @RequestBody Map<String, String> body,
                                            Authentication auth) {
        try {
            itemService.sendBuyRequest(id, body.get("message"), auth.getName());
            return ResponseEntity.ok(Map.of("message", "Buy request sent"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Admin endpoints
    @GetMapping("/admin/all")
    public List<Item> adminListAll() {
        return itemService.getAllItemsForAdmin();
    }

    @GetMapping("/admin/stats")
    public ResponseEntity<?> getStats() {
        return ResponseEntity.ok(itemService.getStatistics());
    }
}
