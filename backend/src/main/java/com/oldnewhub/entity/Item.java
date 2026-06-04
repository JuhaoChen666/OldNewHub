package com.oldnewhub.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Data
@Entity
@Table(name = "items")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Item {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "itemId")
    private Long itemId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    @ManyToOne
    @JoinColumn(name = "categoryId")
    private Category category;

    @ManyToOne
    @JoinColumn(name = "userId")
    private User owner;

    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;

    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<ItemImage> images = new java.util.ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String priceChangeReason;

    public enum Status {
        PENDING, APPROVED, SOLD, REMOVED
    }

    /**
     * Returns true if changing to newPrice would change the price by more than 25%.
     */
    public boolean isSignificantPriceChange(BigDecimal newPrice) {
        if (this.price == null || this.price.compareTo(BigDecimal.ZERO) == 0) return false;
        BigDecimal change = newPrice.subtract(this.price).abs();
        BigDecimal ratio = change.divide(this.price, 4, java.math.RoundingMode.HALF_UP);
        return ratio.compareTo(new BigDecimal("0.25")) > 0;
    }

    /**
     * Calculate the absolute percentage change for display purposes.
     */
    public BigDecimal getPriceChangePercent(BigDecimal newPrice) {
        if (this.price == null || this.price.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        BigDecimal change = newPrice.subtract(this.price).abs();
        return change.divide(this.price, 4, java.math.RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"));
    }
}
