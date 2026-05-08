package com.oldnewhub.repository;

import com.oldnewhub.entity.Item;
import com.oldnewhub.entity.Category;
import com.oldnewhub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findByStatus(Item.Status status);
    List<Item> findByTitleContainingAndStatus(String title, Item.Status status);
    List<Item> findByCategoryAndStatus(Category category, Item.Status status);
    List<Item> findByOwner(User owner);
}
