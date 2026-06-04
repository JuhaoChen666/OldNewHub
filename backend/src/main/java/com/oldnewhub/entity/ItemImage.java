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
    private Long id;

    @Column(nullable = false)
    private String imageUrl;

    @ManyToOne
    @JoinColumn(name = "item_id")
    @JsonBackReference
    private Item item;
}
