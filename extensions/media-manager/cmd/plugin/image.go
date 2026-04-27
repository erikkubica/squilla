package main

import (
	"bytes"
	"fmt"
	"image"
	"image/gif"
	"image/jpeg"
	"image/png"
	"io"

	gowebp "github.com/gen2brain/webp"
	"golang.org/x/image/draw"

	// Register WebP decoder so image.Decode can read WebP files.
	_ "golang.org/x/image/webp"
)

// This file owns the pure image-processing helpers: resize/crop/encode
// and the WebP companion convertor.

func resizeImage(src io.Reader, mimeType string, width, height int, mode string, quality int) ([]byte, string, error) {
	img, err := decodeImage(src, mimeType)
	if err != nil {
		return nil, "", fmt.Errorf("decode: %w", err)
	}
	if quality <= 0 {
		quality = 80
	}

	var resized image.Image
	switch mode {
	case "crop":
		resized = resizeCrop(img, width, height)
	case "fit":
		resized = resizeFit(img, width, height)
	case "width":
		resized = resizeWidth(img, width)
	default:
		return nil, "", fmt.Errorf("unknown resize mode: %s", mode)
	}

	data, err := encodeImage(resized, mimeType, quality)
	if err != nil {
		return nil, "", fmt.Errorf("encode: %w", err)
	}
	return data, mimeType, nil
}

// convertToWebP converts any image to WebP format.
func convertToWebP(src io.Reader, quality int) ([]byte, error) {
	img, _, err := image.Decode(src)
	if err != nil {
		return nil, fmt.Errorf("decode for webp conversion: %w", err)
	}
	var buf bytes.Buffer
	if err := gowebp.Encode(&buf, img, gowebp.Options{Quality: quality}); err != nil {
		return nil, fmt.Errorf("webp encode: %w", err)
	}
	return buf.Bytes(), nil
}

// decodeImage decodes an image from the reader based on MIME type.
func decodeImage(r io.Reader, mimeType string) (image.Image, error) {
	switch mimeType {
	case "image/jpeg":
		return jpeg.Decode(r)
	case "image/png":
		return png.Decode(r)
	case "image/gif":
		return gif.Decode(r)
	case "image/webp":
		img, _, err := image.Decode(r)
		return img, err
	default:
		img, _, err := image.Decode(r)
		return img, err
	}
}

// resizeFit resizes an image to fit inside the given bounds while preserving aspect ratio.
func resizeFit(img image.Image, maxW, maxH int) image.Image {
	bounds := img.Bounds()
	srcW := bounds.Dx()
	srcH := bounds.Dy()

	if srcW <= maxW && srcH <= maxH {
		return img
	}

	ratio := float64(srcW) / float64(srcH)
	newW := maxW
	newH := int(float64(newW) / ratio)

	if newH > maxH {
		newH = maxH
		newW = int(float64(newH) * ratio)
	}

	if newW < 1 {
		newW = 1
	}
	if newH < 1 {
		newH = 1
	}

	dst := image.NewRGBA(image.Rect(0, 0, newW, newH))
	draw.CatmullRom.Scale(dst, dst.Bounds(), img, bounds, draw.Over, nil)
	return dst
}

// resizeCrop resizes an image to cover the target dimensions, then center-crops to exact size.
func resizeCrop(img image.Image, w, h int) image.Image {
	bounds := img.Bounds()
	srcW := bounds.Dx()
	srcH := bounds.Dy()

	scaleW := float64(w) / float64(srcW)
	scaleH := float64(h) / float64(srcH)
	scale := scaleW
	if scaleH > scaleW {
		scale = scaleH
	}

	scaledW := int(float64(srcW) * scale)
	scaledH := int(float64(srcH) * scale)
	if scaledW < 1 {
		scaledW = 1
	}
	if scaledH < 1 {
		scaledH = 1
	}

	scaled := image.NewRGBA(image.Rect(0, 0, scaledW, scaledH))
	draw.CatmullRom.Scale(scaled, scaled.Bounds(), img, bounds, draw.Over, nil)

	offsetX := (scaledW - w) / 2
	offsetY := (scaledH - h) / 2

	dst := image.NewRGBA(image.Rect(0, 0, w, h))
	draw.Copy(dst, image.Point{}, scaled, image.Rect(offsetX, offsetY, offsetX+w, offsetY+h), draw.Src, nil)
	return dst
}

// resizeWidth resizes an image to the given width, preserving aspect ratio.
func resizeWidth(img image.Image, w int) image.Image {
	bounds := img.Bounds()
	srcW := bounds.Dx()
	srcH := bounds.Dy()

	if srcW <= w {
		return img
	}

	ratio := float64(srcH) / float64(srcW)
	newH := int(float64(w) * ratio)
	if newH < 1 {
		newH = 1
	}

	dst := image.NewRGBA(image.Rect(0, 0, w, newH))
	draw.CatmullRom.Scale(dst, dst.Bounds(), img, bounds, draw.Over, nil)
	return dst
}

// encodeImage encodes an image to the specified format.
func encodeImage(img image.Image, mimeType string, quality int) ([]byte, error) {
	var buf bytes.Buffer
	switch mimeType {
	case "image/jpeg":
		if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: quality}); err != nil {
			return nil, err
		}
	case "image/png":
		enc := &png.Encoder{CompressionLevel: png.BestCompression}
		if err := enc.Encode(&buf, img); err != nil {
			return nil, err
		}
	case "image/gif":
		if err := gif.Encode(&buf, img, nil); err != nil {
			return nil, err
		}
	case "image/webp":
		if err := gowebp.Encode(&buf, img, gowebp.Options{Quality: quality}); err != nil {
			return nil, err
		}
	default:
		return nil, fmt.Errorf("unsupported output format: %s", mimeType)
	}
	return buf.Bytes(), nil
}

// mimeFromPath returns the MIME type for a file based on its extension.
