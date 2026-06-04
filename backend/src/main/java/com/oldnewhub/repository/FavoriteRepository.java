package com.oldnewhub.repository;

import com.oldnewhub.entity.Favorite;
import com.oldnewhub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    long countByItem_Owner(User owner);

    @Query("SELECT COUNT(f) > 0 FROM Favorite f WHERE f.user = :user AND f.item.itemId = :itemId")
    boolean existsByUserAndItemItemId(@Param("user") User user, @Param("itemId") Long itemId);
}
