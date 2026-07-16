import { describe, test, expect } from "bun:test";
import {
  formatDuration,
  getAttachmentMeta,
  getInitials,
  getMessageFallbackText,
} from "./utils";

describe("getInitials", () => {
  test("should return 2 letter when input 2 words name", () => {
    const result = getInitials("John Doe");
    expect(result).toBe("JD");
  });

  test("should return 1 letter when input 1 word name", () => {
    expect(getInitials("John")).toBe("J");
  });

  test("should return 2 letter when input name longer than 2 words", () => {
    expect(getInitials("John Doe Smith")).toBe("JD");
  });

  test("should fallback when input empty string", () => {
    expect(getInitials("")).toBe("U");
  });
});

describe("formatDuration", () => {
  test("should return 00:00 when input is 0", () => {
    expect(formatDuration(0)).toBe("00:00");
  });

  test("should format seconds below 1 minute", () => {
    expect(formatDuration(45)).toBe("00:45");
  });

  test("should format seconds above 1 minute", () => {
    expect(formatDuration(65)).toBe("01:05");
  });

  test("should handle exactly 1 hour", () => {
    expect(formatDuration(3600)).toBe("60:00");
  });
});

describe("getAttachmentMeta", () => {
  test("should detect image file correctly", () => {
    const meta = getAttachmentMeta("https://example.com/file?name=foto.png");
    expect(meta.name).toBe("foto.png");
    expect(meta.isImg).toBe(true);
    expect(meta.isVid).toBe(false);
  });

  test("should detect video file correctly", () => {
    const meta = getAttachmentMeta("https://example.com/file?name=intro.mp4");
    expect(meta.name).toBe("intro.mp4");
    expect(meta.isImg).toBe(false);
    expect(meta.isVid).toBe(true);
  });

  test("should detect document as non-image and non-video", () => {
    const meta = getAttachmentMeta("https://example.com/file?name=cv.pdf");
    expect(meta.name).toBe("cv.pdf");
    expect(meta.isImg).toBe(false);
    expect(meta.isVid).toBe(false);
  });

  test("should fallback when URL has no name parameter", () => {
    const meta = getAttachmentMeta("https://example.com/gambar.jpg");
    expect(meta.name).toBe("Image");
    expect(meta.isImg).toBe(true);
  });
});

describe("getMessageFallbackText", () => {
  test("should return content text when message has content", () => {
    const result = getMessageFallbackText({ content: "Hello!", images: [] });
    expect(result).toBe("Hello!");
  });

  test("should return image emoji when message has 1 image", () => {
    const result = getMessageFallbackText({
      content: null,
      images: ["https://example.com/f?name=foto.png"],
    });
    expect(result).toBe("📷 Image");
  });

  test("should return video emoji when message has 1 video", () => {
    const result = getMessageFallbackText({
      content: null,
      images: ["https://example.com/f?name=clip.mp4"],
    });
    expect(result).toBe("🎥 Video");
  });

  test("should return file emoji when message has 1 document", () => {
    const result = getMessageFallbackText({
      content: null,
      images: ["https://example.com/f?name=resume.pdf"],
    });
    expect(result).toBe("📁 File");
  });

  test("should return attachments when message has multiple files", () => {
    const result = getMessageFallbackText({
      content: null,
      images: [
        "https://example.com/f?name=a.png",
        "https://example.com/f?name=b.mp4",
      ],
    });
    expect(result).toBe("📎 Attachments");
  });

  test("should return 'Message' when no content and no images", () => {
    const result = getMessageFallbackText({ content: null, images: [] });
    expect(result).toBe("Message");
  });
});
