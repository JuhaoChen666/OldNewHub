package com.oldnewhub.repository;

import com.oldnewhub.entity.Favorite;
import com.oldnewhub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    long countByItem_Owner(User owner);
    boolean existsByUserAndItem_Id(User user, Long itemId);
}
