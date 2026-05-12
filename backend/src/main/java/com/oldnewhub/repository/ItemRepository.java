package com.oldnewhub.repository;

import com.oldnewhub.entity.Item;
import com.oldnewhub.entity.Category;
import com.oldnewhub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findByStatus(Item.Status status);
    List<Item> findByTitleContainingAndStatus(String title, Item.Status status);
    List<Item> findByCategoryAndStatus(Category category, Item.Status status);
    List<Item> findByOwner(User owner);

    long countByOwnerAndStatus(User owner, Item.Status status);

    @Query("SELECT SUM(i.price) FROM Item i WHERE i.owner = :owner AND i.status = :status")
    BigDecimal sumPriceByOwnerAndStatus(@Param("owner") User owner, @Param("status") Item.Status status);
}
