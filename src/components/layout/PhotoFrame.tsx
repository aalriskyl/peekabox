// src/components/PhotoFrame.tsx
"use client";

import Image from "next/image";
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import SaveFrameButton from "./SaveFrameButton";

interface PhotoFrameProps {
  photos: { id: string; url: string }[];
  frameImage?: string;
  onPhotosChange?: (photos: { id: string; url: string }[]) => void;
  onSaveComplete?: (finalImagePath: string) => void;
}

// Sortable photo item component
function SortablePhoto({
  photo,
  index,
}: {
  photo: { id: string; url: string };
  index: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : "auto",
    position: "relative" as const,
  };

  return (
    <div ref={setNodeRef} style={style} className="w-full h-full">
      <div className="absolute inset-0" {...attributes} {...listeners}>
        <Image
          src={photo.url}
          alt={`Photo ${index + 1}`}
          fill
          className="w-full h-full object-cover object-[60%_50%] cursor-move"
        />
      </div>
    </div>
  );
}

// Placeholder positions (x, y, width, height, rotation)
const PLACEHOLDERS = [
  { id: "1", x: "134px", y: "511px", width: "1048px", height: "659px" },
  { id: "2", x: "134px", y: "1358px", width: "1048px", height: "659px" },
  { id: "3", x: "134px", y: "2213px", width: "1048px", height: "659px" },
  { id: "4", x: "1460px", y: "511px", width: "1048px", height: "659px" },
  { id: "5", x: "1460px", y: "1358px", width: "1048px", height: "659px" },
  { id: "6", x: "1460px", y: "2213px", width: "1048px", height: "659px" },
];

export default function PhotoFrame({
  photos,
  frameImage = "/frame-overlay.png",
  onPhotosChange,
  onSaveComplete,
}: PhotoFrameProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = photos.findIndex((photo) => photo.id === active.id);
      const newIndex = photos.findIndex((photo) => photo.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newPhotos = arrayMove(photos, oldIndex, newIndex);
        onPhotosChange?.(newPhotos);
      }
    }
  };
  return (
    <div
      className="relative w-full"
      style={{
        width: "2635px",
        height: "3715px",
        maxWidth: "100%",
        margin: "0 auto",
        backgroundColor: "#ffffff",
        transform: "scale(0.13)",
        transformOrigin: "top left",
        position: "absolute",
        left: "0",
        marginLeft: "150px",
      }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={photos.map((photo) => photo.id)}
          strategy={verticalListSortingStrategy}
        >
          {PLACEHOLDERS.map((placeholder, index) => {
            const photo = photos[index];
            return (
              <div
                key={placeholder.id}
                className="absolute overflow-hidden bg-white"
                style={{
                  left: placeholder.x,
                  top: placeholder.y,
                  width: placeholder.width,
                  height: placeholder.height,
                  border: "1px dashed #ccc", // Visual indicator for placeholder
                }}
              >
                {photo?.url ? (
                  <SortablePhoto photo={photo} index={index} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                    Drop photo here
                  </div>
                )}
              </div>
            );
          })}
        </SortableContext>
      </DndContext>

      {/* Frame Overlay */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          width: "2635px",
          height: "3715px",
          transform: "scale(1)",
          transformOrigin: "top left",
        }}
      >
        {frameImage && (
          <Image
            src={frameImage}
            alt="Frame"
            width={1240}
            height={1748}
            className="w-full h-full"
          />
        )}
      </div>

      {/* Save Button */}
      <SaveFrameButton
        photos={photos}
        frameImage={frameImage}
        onSaveComplete={onSaveComplete}
      />
    </div>
  );
}
