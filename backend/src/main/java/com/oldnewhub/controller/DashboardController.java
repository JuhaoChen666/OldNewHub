package com.oldnewhub.controller;

import com.oldnewhub.dto.DashboardDTO;
import com.oldnewhub.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/stats")
    public DashboardDTO getStats(Authentication auth) {
        return dashboardService.getDashboardData(auth.getName());
    }
}
