import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Upload "auto" biasanya menyimpan PDF sebagai tipe image, tapi cek ketiganya
for (const type of ['image', 'raw', 'video']) {
  const res = await cloudinary.api.delete_all_resources({ resource_type: type })
  console.log(type, JSON.stringify(res))
}