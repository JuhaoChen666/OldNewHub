package com.oldnewhub.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Data
@Entity
@Table(name = "item_images")
@ToString(exclude = "item")
public class ItemImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "imageId")
    private Long imageId;

    @Column(nullable = false)
    private String imageUrl;

    @ManyToOne
    @JoinColumn(name = "itemId")
    @JsonBackReference
    private Item item;
}
