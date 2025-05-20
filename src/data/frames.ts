interface Frame {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl: string;
}

export const frames: Frame[] = [
  {
    id: 'frame-1',
    name: 'Classic White',
    imageUrl: '/frames/classic-white.png',
    thumbnailUrl: '/frames/thumbnails/classic-white-thumb.jpg',
  },
  {
    id: 'frame-2',
    name: 'Vintage Wood',
    imageUrl: '/frames/vintage-wood.png',
    thumbnailUrl: '/frames/thumbnails/vintage-wood-thumb.jpg',
  },
  {
    id: 'frame-3',
    name: 'Modern Black',
    imageUrl: '/frames/modern-black.png',
    thumbnailUrl: '/frames/thumbnails/modern-black-thumb.jpg',
  },
  {
    id: 'frame-4',
    name: 'Gold Leaf',
    imageUrl: '/frames/gold-leaf.png',
    thumbnailUrl: '/frames/thumbnails/gold-leaf-thumb.jpg',
  },
  {
    id: 'frame-5',
    name: 'Minimalist',
    imageUrl: '/frames/minimalist.png',
    thumbnailUrl: '/frames/thumbnails/minimalist-thumb.jpg',
  },
  {
    id: 'frame-6',
    name: 'Ornate Gold',
    imageUrl: '/frames/ornate-gold.png',
    thumbnailUrl: '/frames/thumbnails/ornate-gold-thumb.jpg',
  },
];
