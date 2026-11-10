use std::alloc::{alloc_zeroed, dealloc, Layout};
use std::ops::{Deref, DerefMut};
use std::ptr::NonNull;

/// 64-byte cache-line aligned continuous heap buffer.
///
/// Guarantees that data aligns with modern CPU cache lines (x86_64, ARM64/Apple Silicon)
/// and fulfills alignment prerequisites for 128-bit / 256-bit SIMD / NEON loads.
pub struct AlignedBuffer<T: Copy> {
    ptr: NonNull<T>,
    len: usize,
    layout: Layout,
}

// Safety: T is Copy (e.g. f32, u8), buffer owns memory exclusively.
unsafe impl<T: Copy + Send> Send for AlignedBuffer<T> {}
unsafe impl<T: Copy + Sync> Sync for AlignedBuffer<T> {}

impl<T: Copy> AlignedBuffer<T> {
    pub const ALIGNMENT: usize = 64;

    /// Allocate a zeroed buffer of `len` elements aligned to 64 bytes.
    pub fn zeroed(len: usize) -> Self {
        assert!(len > 0, "Buffer length must be non-zero");
        let elem_size = std::mem::size_of::<T>();
        let total_bytes = len.checked_mul(elem_size).expect("Buffer size overflow");

        let layout = Layout::from_size_align(total_bytes, Self::ALIGNMENT)
            .expect("Invalid layout for AlignedBuffer");

        let raw_ptr = unsafe { alloc_zeroed(layout) as *mut T };
        let ptr = NonNull::new(raw_ptr).expect("Allocation failed: Out of memory");

        Self { ptr, len, layout }
    }

    /// Allocate a buffer filled with `val` aligned to 64 bytes.
    pub fn filled(len: usize, val: T) -> Self {
        let mut buf = Self::zeroed(len);
        buf.as_mut_slice().fill(val);
        buf
    }

    #[inline(always)]
    pub fn len(&self) -> usize {
        self.len
    }

    #[inline(always)]
    pub fn is_empty(&self) -> bool {
        self.len == 0
    }

    #[inline(always)]
    pub fn as_slice(&self) -> &[T] {
        unsafe { std::slice::from_raw_parts(self.ptr.as_ptr(), self.len) }
    }

    #[inline(always)]
    pub fn as_mut_slice(&mut self) -> &mut [T] {
        unsafe { std::slice::from_raw_parts_mut(self.ptr.as_ptr(), self.len) }
    }

    #[inline(always)]
    pub fn as_ptr(&self) -> *const T {
        self.ptr.as_ptr()
    }

    #[inline(always)]
    pub fn as_mut_ptr(&mut self) -> *mut T {
        self.ptr.as_ptr()
    }
}

impl<T: Copy> Deref for AlignedBuffer<T> {
    type Target = [T];

    #[inline(always)]
    fn deref(&self) -> &Self::Target {
        self.as_slice()
    }
}

impl<T: Copy> DerefMut for AlignedBuffer<T> {
    #[inline(always)]
    fn deref_mut(&mut self) -> &mut Self::Target {
        self.as_mut_slice()
    }
}

impl<T: Copy> Drop for AlignedBuffer<T> {
    fn drop(&mut self) {
        unsafe {
            dealloc(self.ptr.as_ptr() as *mut u8, self.layout);
        }
    }
}
