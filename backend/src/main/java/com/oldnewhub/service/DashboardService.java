package com.oldnewhub.service;

import com.oldnewhub.dto.DashboardDTO;
import com.oldnewhub.entity.Announcement;
import com.oldnewhub.entity.Item;
import com.oldnewhub.entity.User;
import com.oldnewhub.repository.AnnouncementRepository;
import com.oldnewhub.repository.FavoriteRepository;
import com.oldnewhub.repository.ItemRepository;
import com.oldnewhub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;

@Service
public class DashboardService {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private UserRepository userRepository;

    public DashboardDTO getDashboardData(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        long activeItems = itemRepository.countByOwnerAndStatus(user, Item.Status.APPROVED);
        long favorites = favoriteRepository.countByItem_Owner(user);
        BigDecimal sales = itemRepository.sumPriceByOwnerAndStatus(user, Item.Status.SOLD);
        
        // Handle null if no items sold yet
        if (sales == null) sales = BigDecimal.ZERO;

        List<Announcement> announcements = announcementRepository.findTop5ByOrderByPriorityDescCreatedAtDesc();

        return DashboardDTO.builder()
                .activeItemsCount(activeItems)
                .totalFavorites(favorites)
                .totalSales(sales)
                .announcements(announcements)
                .build();
    }
}
