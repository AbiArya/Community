import { render, screen, fireEvent } from "@testing-library/react";
import { PhotoManagement } from "@/components/profile/PhotoManagement";
import type { UserPhoto } from "@/hooks/useProfileData";

describe("PhotoManagement", () => {
  const mockPhotos: UserPhoto[] = [
    {
      id: "photo-1",
      photo_url: "https://example.com/photo1.jpg",
      storage_path: "user-1/photo1.jpg",
      display_order: 0,
      is_primary: true,
      created_at: "2024-01-01",
    },
    {
      id: "photo-2",
      photo_url: "https://example.com/photo2.jpg",
      storage_path: "user-1/photo2.jpg",
      display_order: 1,
      is_primary: false,
      created_at: "2024-01-02",
    },
  ];

  const mockOnPhotoChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders no photos state", () => {
    render(<PhotoManagement photos={[]} onPhotoChange={mockOnPhotoChange} />);
    
    expect(screen.getByText(/No photos uploaded yet/)).toBeInTheDocument();
    expect(screen.getByText(/3 remaining/)).toBeInTheDocument();
  });

  test("renders existing photos", () => {
    render(<PhotoManagement photos={mockPhotos} onPhotoChange={mockOnPhotoChange} />);
    
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    // Next.js Image transforms the URL
    expect(images[0].getAttribute("src")).toContain(encodeURIComponent("https://example.com/photo1.jpg"));
    expect(images[1].getAttribute("src")).toContain(encodeURIComponent("https://example.com/photo2.jpg"));
  });

  test("shows primary photo badge", () => {
    const { container } = render(<PhotoManagement photos={mockPhotos} onPhotoChange={mockOnPhotoChange} />);
    
    const primaryBadge = container.querySelector('.absolute.top-2.left-2');
    expect(primaryBadge).toHaveTextContent("Primary");
  });

  test("enforces photo limit display", () => {
    const threePhotos: UserPhoto[] = [
      ...mockPhotos,
      {
        id: "photo-3",
        photo_url: "https://example.com/photo3.jpg",
        storage_path: "user-1/photo3.jpg",
        display_order: 2,
        is_primary: false,
        created_at: "2024-01-03",
      },
    ];

    render(<PhotoManagement photos={threePhotos} onPhotoChange={mockOnPhotoChange} />);
    
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(3);
    expect(screen.getByText(/0 remaining/)).toBeInTheDocument();
  });

  test("calls onPhotoChange when delete is clicked", () => {
    render(<PhotoManagement photos={mockPhotos} onPhotoChange={mockOnPhotoChange} />);
    
    const deleteButtons = screen.getAllByLabelText("Remove photo");
    fireEvent.click(deleteButtons[0]);
    
    expect(mockOnPhotoChange).toHaveBeenCalledWith({
      type: 'delete',
      photoId: 'photo-1',
      storagePath: 'user-1/photo1.jpg',
    });
  });

  test("displays external error message", () => {
    const errorMessage = "Something went wrong";
    render(<PhotoManagement photos={mockPhotos} onPhotoChange={mockOnPhotoChange} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
