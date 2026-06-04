package com.oldnewhub;

import com.oldnewhub.entity.Item;
import com.oldnewhub.entity.User;
import com.oldnewhub.repository.UserRepository;
import com.oldnewhub.service.ItemService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Paths;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class ImageUploadTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ItemService itemService;

    @Test
    @WithMockUser(username = "testuser")
    public void testUploadItemWithImages() throws Exception {
        // Prepare user
        if (userRepository.findByUsername("testuser").isEmpty()) {
            User user = new User();
            user.setUsername("testuser");
            user.setPassword("password");
            user.setEmail("test@example.com");
            user.setRole(User.Role.USER);
            userRepository.save(user);
        }

        // Prepare item JSON
        String itemJson = "{\"title\":\"Test Item\",\"description\":\"Test Description\",\"price\":99.99}";
        MockMultipartFile itemPart = new MockMultipartFile(
                "item",
                "",
                MediaType.APPLICATION_JSON_VALUE,
                itemJson.getBytes()
        );

        // Prepare images
        MockMultipartFile image1 = new MockMultipartFile(
                "images",
                "test1.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                "fake image content 1".getBytes()
        );
        MockMultipartFile image2 = new MockMultipartFile(
                "images",
                "test2.png",
                MediaType.IMAGE_PNG_VALUE,
                "fake image content 2".getBytes()
        );

        // Perform upload
        mockMvc.perform(multipart("/api/items/upload")
                .file(itemPart)
                .file(image1)
                .file(image2)
                .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isOk());

        // Verify files exist in the Assets folder
        User owner = userRepository.findByUsername("testuser").get();
        // Since we don't know the itemId until it's saved, we'll check the service logic
        var items = itemService.getMyItems("testuser");
        assertFalse(items.isEmpty());
        Item savedItem = items.get(0);
        assertEquals(2, savedItem.getImages().size());
        
        String firstImageUrl = savedItem.getImages().get(0).getImageUrl();
        assertTrue(firstImageUrl.startsWith("/Assets/"));
        
        // Check if file physically exists
        String physicalPath = "backend/src/main/resources" + firstImageUrl;
        assertTrue(Files.exists(Paths.get(physicalPath)));
    }
}
