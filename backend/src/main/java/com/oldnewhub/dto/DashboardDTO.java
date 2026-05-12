package com.oldnewhub.dto;

import com.oldnewhub.entity.Announcement;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class DashboardDTO {
    private long activeItemsCount;
    private long totalFavorites;
    private BigDecimal totalSales;
    private List<Announcement> announcements;
}
