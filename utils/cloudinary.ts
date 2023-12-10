import cloudinary from "cloudinary";

export const uploadImageToCloudinary = async (
  image: string,
  folder: string,
  width?: number
) => {
  const result = await cloudinary.v2.uploader.upload(image, { width, folder });

  // console.log(result);

  return {
    public_id: result.public_id,
    url: result.secure_url,
  };
};

export const deleteImageFromCloudinary = async (public_id: string) => {
  await cloudinary.v2.uploader.destroy(public_id);
};
