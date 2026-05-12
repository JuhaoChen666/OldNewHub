package com.oldnewhub.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "announcements")
public class Announcement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Enumerated(EnumType.STRING)
    private Type type = Type.NOTICE;

    private Integer priority = 0;

    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Type {
        NOTICE, RECOMMEND
    }
}
