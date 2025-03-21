import sharp from "sharp"

export const compressImage = async (image: any) => {
    const buffer = Buffer.from(image, "base64")

    const compressedBuffer = await sharp(buffer).resize({ width: 800 }).png({ compressionLevel: 9 }).toBuffer()
    return compressedBuffer.toString("base64")
}