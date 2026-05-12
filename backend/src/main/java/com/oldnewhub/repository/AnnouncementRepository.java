package com.oldnewhub.repository;

import com.oldnewhub.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findTop5ByOrderByPriorityDescCreatedAtDesc();
}
