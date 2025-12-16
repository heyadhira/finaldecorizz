import React, { useEffect, useState, useContext } from "react";
import { Plus, Edit, Trash2, X, Copy } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { projectId, publicAnonKey } from "../../utils/supabase/info";
import { toast } from "sonner";
import AdminSidebar from "./AdminSidebar";

export default function AdminProducts() {
  const { accessToken } = useContext(AuthContext);

  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [colorImageFiles, setColorImageFiles] = useState<Record<string, File | null>>({});
  const [colorImagePreviews, setColorImagePreviews] = useState<{White?: string; Black?: string; Brown?: string}>({});

  const [extraImages, setExtraImages] = useState<File[]>([]);
const [extraImagePreviews, setExtraImagePreviews] = useState<string[]>([]);



  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Home Decor",
    material: "Wood",
    image: "",
    colors: ["White", "Black", "Brown"],
    sizes: [
      "8X12", "12X18", "18X24", "20X30", "24X36", "30X40", "36X48", "48X66",
      "18X18", "24X24", "36X36", "20X20", "30X30"
    ],
    roomCategory: "",
    layout: "",
    subsection: "Basic",
    format: "Rolled",
    frameColor: "Black",
    imagesByColor: { White: "", Black: "", Brown: "" },
  });

  const handleExtraImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  setExtraImages(files);

  const previews = files.map((file) => URL.createObjectURL(file));
  setExtraImagePreviews(previews);
};

  // Fetch Products
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Fetch products error:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleColorImageChange = (color: 'White' | 'Black' | 'Brown') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setColorImageFiles(prev => ({ ...prev, [color]: file }));
      const reader = new FileReader();
      reader.onloadend = () => setColorImagePreviews(prev => ({ ...prev, [color]: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const uploadColorImage = async (color: 'White' | 'Black' | 'Brown') => {
    const file = colorImageFiles[color];
    if (!file) return (formData.imagesByColor as any)[color];
    const fd = new FormData();
    fd.append('file', file);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products/upload`,
        { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: fd }
      );
      const data = await response.json();
      if (response.ok && data.url) return data.url;
      toast.error(`Image upload failed for ${color}`);
      return (formData.imagesByColor as any)[color];
    } catch {
      toast.error(`Image upload failed for ${color}`);
      return (formData.imagesByColor as any)[color];
    }
  };


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadExtraImages = async () => {
  let uploadedUrls: string[] = [];

  for (const file of extraImages) {
    const fd = new FormData();
    fd.append("file", file);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products/upload`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: fd,
        }
      );

      const data = await response.json();
      if (response.ok && data.url) {
        uploadedUrls.push(data.url);
      }
    } catch {
      toast.error("Failed uploading extra images");
    }
  }

  return uploadedUrls;
};


  const uploadImage = async () => {
    if (!imageFile) return formData.image;

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', imageFile);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products/upload`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formDataUpload,
        }
      );

      const data = await response.json();
      if (response.ok && data.url) {
        return data.url;
      } else {
        toast.error('Image upload failed');
        return formData.image;
      }
    } catch (error) {
      toast.error('Image upload failed');
      return formData.image;
    } finally {
      setUploading(false);
    }
  };
  const openModal = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price.toString(),
        category: product.category,
        material: product.material,
        roomCategory: product.roomCategory || "",
        layout: product.layout || "",
        image: product.image,
        colors: product.colors || [],
        sizes: product.sizes || [],
        subsection: product.subsection || "Basic",
        format: product.format || "Rolled",
        frameColor: product.frameColor || "Black",
        imagesByColor: (product as any).imagesByColor || { White: "", Black: "", Brown: "" },
      });

      setExtraImages([]);
  setExtraImagePreviews([]);
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "Home Decor",
        material: "Wood",
        image: "",
        colors: ["White", "Black", "Brown"],
        sizes: [
          "8X12", "12X18", "18X24", "20X30", "24X36", "30X40", "36X48", "48X66",
          "18X18", "24X24", "36X36", "20X20", "30X30"
        ],
        roomCategory: "",
        layout: "",
        subsection: "Basic",
        format: "Rolled",
        frameColor: "Black",
        imagesByColor: { White: "", Black: "", Brown: "" },
      });
    }

    setShowModal(true);
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    // Upload image first if new image selected
    const extraImagesUrls = await uploadExtraImages();

    const imageUrl = await uploadImage();
    const byColor: any = { ...formData.imagesByColor };
    for (const c of ['White','Black','Brown'] as const) {
      byColor[c] = await uploadColorImage(c);
    }

    const bodyData = {
      ...formData,
      price: parseFloat(formData.price),
      image: imageUrl,
      imagesByColor: byColor,
        // 🟢 FIX — preserve old gallery images
  extraImages: extraImagesUrls.length > 0 
    ? extraImagesUrls 
    : editingProduct?.extraImages || [],
    };

    try {
      const url = editingProduct
        ? `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products/${editingProduct.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products`;

      const response = await fetch(url, {
        method: editingProduct ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(bodyData),
      });

      if (response.ok) {
        toast.success(editingProduct ? "Product updated" : "Product created");
        setShowModal(false);
        fetchProducts();
      } else {
        toast.error("Failed to save product");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save product");
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Product deleted");
        fetchProducts();
      } else {
        toast.error("Failed to delete product");
      }
    } catch (error) {
      console.error("Delete product error:", error);
      toast.error("Could not delete product");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Admin Sidebar */}
      <AdminSidebar onSidebarWidthChange={(w) => setSidebarWidth(w)} />

      {/* Main Content */}
      <div className="w-full pt-16 p-4 md:p-8" style={{ marginLeft: isDesktop ? sidebarWidth : 0 }}>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">
            Manage Products
          </h1>

          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-12 w-12 border-b-2 border-gray-800 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-900">ID</th>
                  <th className="px-6 py-3 text-left text-gray-900">Image</th>
                  <th className="px-6 py-3 text-left text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left text-gray-900">Category</th>
                  <th className="px-6 py-3 text-left text-gray-900">Subsection</th>
                  <th className="px-6 py-3 text-left text-gray-900">Format</th>
                  <th className="px-6 py-3 text-left text-gray-900">Frame Color</th>
                  <th className="px-6 py-3 text-left text-gray-900">Price</th>
                  <th className="px-6 py-3 text-left text-gray-900">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[180px] inline-block align-middle">{product.id}</span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(product.id); toast.success("Copied"); }}
                          className="p-1 rounded border hover:bg-gray-100"
                          title="Copy ID"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    </td>

                    <td className="px-6 py-4 text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 text-gray-600">{product.category}</td>
                    <td className="px-6 py-4 text-gray-600">{product.subsection || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{product.format || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{product.frameColor || '-'}</td>
                    <td className="px-6 py-4 text-gray-900">
                      ₹{product.price.toFixed(2)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => openModal(product)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

{showModal && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto pb-6 pt-6">
    
    <div className="min-h-screen flex justify-center items-start py-10 px-4">
      
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-none animate-fadeIn">

        {/* HEADER */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {editingProduct ? "Update product details" : "Fill in the details to create a new product"}
            </p>
          </div>

          <button
            onClick={() => setShowModal(false)}
            className="hover:bg-white/50 p-2 rounded-full transition-all hover:rotate-90 duration-300"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* BODY SCROLLER */}
        <div className="max-h-[80vh] overflow-y-auto px-6 py-6 space-y-6">
          {/** FORM CONTENT HERE **/}

          {/* FORM (NO MAX-WRAPPER) */}
        <form onSubmit={saveProduct} className="space-y-6">

          {/* BASIC INFO SECTION */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-600 rounded"></span>
              Basic Information
            </h3>

          {/* NAME */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Product Name *</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* PRICE + CATEGORY RESPONSIVE GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Price */}
            <div>
              <label className="block font-medium text-gray-700 mb-1">Price (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                className="w-full px-4 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
              />
            </div>
          </div>

          {/* CATEGORIZATION SECTION */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-600 rounded"></span>
              Categorization & Filters
            </h3>

            {/* Category */}
            <div>
              <label className="block font-medium text-gray-700 mb-1">Category</label>
              <select
                className="w-full px-4 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                <option value="Home Decor">Home Decor</option>
                <option value="Wall Art">Wall Art</option>
                <option value="Bestselling">Bestselling</option>
                <option value="Hot & Fresh">Hot & Fresh</option>
                <option value="Gen Z">Gen Z</option>
                <option value="Graffiti Art">Graffiti Art</option>
                <option value="Modern Art">Modern Art</option>
                <option value="Animal">Animal</option>
                <option value="Pop Art">Pop Art</option>
                <option value="Black & White">Black & White</option>
                <option value="Spiritual">Spiritual</option>
              </select>
            </div>

            {/* Subsection */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Subsection</label>
                <select
                  className="w-full px-4 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
                  value={formData.subsection}
                  onChange={(e) => setFormData({ ...formData, subsection: e.target.value })}
                >
                  <option value="Basic">Basic</option>
                  <option value="2-Set">2-Set</option>
                  <option value="3-Set">3-Set</option>
                  <option value="Square">Square</option>
                </select>
              </div>

              {/* Format */}
              <div>
                <label className="block font-medium text-gray-700 mb-1">Format</label>
                <select
                  className="w-full px-4 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                >
                  <option value="Rolled">Rolled</option>
                  <option value="Canvas">Canvas</option>
                  <option value="Frame">Frame</option>
                </select>
              </div>

              {/* Frame Color */}
              <div>
                <label className="block font-medium text-gray-700 mb-1">Frame Color</label>
                <select
                  className="w-full px-4 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
                  value={formData.frameColor}
                  onChange={(e) => setFormData({ ...formData, frameColor: e.target.value })}
                  disabled={formData.format !== 'Frame'}
                >
                  <option value="White">White</option>
                  <option value="Black">Black</option>
                  <option value="Brown">Brown</option>
                </select>
              </div>
            </div>
          </div>

          {/* MATERIAL */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Material</label>
            <select
              className="w-full px-4 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
              value={formData.material}
              onChange={(e) =>
                setFormData({ ...formData, material: e.target.value })
              }
            >
              <option value="Wood">Wood</option>
              <option value="Metal">Metal</option>
              <option value="Plastic">Plastic</option>
              <option value="Glass">Glass</option>
            </select>
          </div>

          {/* ROOM CATEGORY */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Decor by Room (Optional)</label>
            <select
              className="w-full px-4 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
              value={formData.roomCategory}
              onChange={(e) =>
                setFormData({ ...formData, roomCategory: e.target.value })
              }
            >
              <option value="">-- Select Room --</option>
              <option value="Home Bar">Home Bar</option>
              <option value="Bath Space">Bath Space</option>
              <option value="Bedroom">Bedroom</option>
              <option value="Dining Area">Dining Area</option>
              <option value="Game Zone / Lounge Cave">Game Zone / Lounge Cave</option>
              <option value="Workshop / Garage Space">Workshop / Garage Space</option>
              <option value="Fitness Room">Fitness Room</option>
              <option value="Entryway / Corridor">Entryway / Corridor</option>
              <option value="Kids Space">Kids Space</option>
              <option value="Kitchen">Kitchen</option>
              <option value="Living Area">Living Area</option>
              <option value="Office / Study Zone">Office / Study Zone</option>
              <option value="Pooja Room">Pooja Room</option>
            </select>
          </div>

          {/* LAYOUT */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Layout (Optional)</label>
            <select
              className="w-full px-4 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
              value={formData.layout}
              onChange={(e) =>
                setFormData({ ...formData, layout: e.target.value })
              }
            >
              <option value="">-- Select Layout --</option>
              <option value="Portrait">Portrait</option>
              <option value="Square">Square</option>
              <option value="Landscape">Landscape</option>
            </select>
          </div>
          </div>

          {/* IMAGE SECTION */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-600 rounded"></span>
              Product Image
            </h3>

          {/* IMAGE UPLOAD */}
          <div>
            <label className="block font-medium text-gray-700 mb-2">Product Image *</label>
            
            {/* Image Preview */}
            {(imagePreview || formData.image) && (
              <div className="mb-4 relative">
                <img 
                  src={imagePreview || formData.image} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview('');
                    setImageFile(null);
                    setFormData({ ...formData, image: '' });
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="mt-3">
                  <label htmlFor="product-image-input" className="inline-block px-4 py-2 rounded-lg border-2 text-sm font-semibold cursor-pointer"
                    style={{ borderColor: '#d1d5db', color: '#374151' }}
                  >
                    Replace Image
                  </label>
                  <input
                    id="product-image-input"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
              </div>
            )}

            {/* File Input - shown only when no preview */}
            {!(imagePreview || formData.image) && (
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-gray-500">PNG, JPG, WEBP (MAX. 5MB)</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            )}
          </div>
          </div>

          {/* COLORS */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-600 rounded"></span>
              Available Colors
            </h3>
            <p className="text-sm text-gray-500 mb-4">Select colors available for this product</p>
          </div>

          {/* COLOR-SPECIFIC IMAGES */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-600 rounded"></span>
              Frame Images by Color (optional)
            </h3>
            <p className="text-sm text-gray-500 mb-4">Upload different frame images for White, Black, Brown</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(['White','Black','Brown'] as const).map(color => (
                <div key={color} className="border rounded-lg p-3">
                  <p className="text-sm font-semibold text-gray-800 mb-2">{color}</p>
                  {(colorImagePreviews[color] || (formData.imagesByColor as any)[color]) ? (
                    <div className="relative">
                      <img
                        src={colorImagePreviews[color] || (formData.imagesByColor as any)[color]}
                        alt={`${color} frame`}
                        className="w-full h-32 object-cover rounded"
                      />
                      <label className="mt-2 inline-block px-3 py-1 rounded border text-sm cursor-pointer" style={{ borderColor: '#d1d5db', color: '#374151' }}>
                        Replace
                        <input type="file" className="hidden" accept="image/*" onChange={handleColorImageChange(color)} />
                      </label>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <span className="text-xs text-gray-500">Upload {color} frame image</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleColorImageChange(color)} />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {["White", "Black", "Brown"].map((color) => (
              <label
                key={color}
                className="flex items-center gap-2 border border-gray-300 
                           rounded-lg p-2 cursor-pointer hover:bg-gray-100 transition"
              >
                <input
                  type="checkbox"
                  checked={formData.colors.includes(color)}
                  onChange={() => {
                    let updated = [...formData.colors];
                    updated = updated.includes(color)
                      ? updated.filter((c) => c !== color)
                      : [...updated, color];
                    setFormData({ ...formData, colors: updated });
                  }}
                />
                <span className="text-gray-700">{color}</span>
              </label>
            ))}
          </div>

          {/* MULTIPLE IMAGES SECTION */}
<div className="border-t pt-6 mt-6">
  <h3 className="text-lg font-bold text-gray-900 mb-1">
    Additional Product Images (Optional)
  </h3>
  <p className="text-sm text-gray-500 mb-4">
    Upload multiple images for gallery display
  </p>

  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
    <span className="text-sm text-gray-600">Choose Multiple Images</span>
    <input
      type="file"
      multiple
      accept="image/*"
      className="hidden"
      onChange={handleExtraImagesChange}
    />
  </label>

  {/* Previews */}
  {extraImagePreviews.length > 0 && (
    <div className="grid grid-cols-3 gap-3 mt-4">
      {extraImagePreviews.map((src, idx) => (
        <div key={idx} className="relative">
          <img
            src={src}
            className="w-full h-24 object-cover rounded border"
          />
          <button
            type="button"
            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded"
            onClick={() => {
              const updatedFiles = [...extraImages];
              const updatedPreviews = [...extraImagePreviews];
              updatedFiles.splice(idx, 1);
              updatedPreviews.splice(idx, 1);
              setExtraImages(updatedFiles);
              setExtraImagePreviews(updatedPreviews);
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )}
</div>


          {/* SIZES */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-600 rounded"></span>
              Available Sizes
            </h3>
            <p className="text-sm text-gray-500 mb-4">Select sizes available for this product</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {["8X12", "12X18", "18X24", "20X30", "24X36", "30X40", "36X48", "48X66", "18X18", "24X24", "36X36", "20X20", "30X30"].map((size) => (
              <label
                key={size}
                className="flex items-center gap-2 border border-gray-300 
                           rounded-lg p-2 cursor-pointer hover:bg-gray-100 transition"
              >
                <input
                  type="checkbox"
                  checked={formData.sizes.includes(size)}
                  onChange={() => {
                    let updated = [...formData.sizes];
                    updated = updated.includes(size)
                      ? updated.filter((s) => s !== size)
                      : [...updated, size];
                    setFormData({ ...formData, sizes: updated });
                  }}
                />
                <span className="text-gray-700">{size}</span>
              </label>
            ))}
          </div>

          {/* BUTTONS */}
          <div className="flex gap-4 pt-6 border-t mt-6">
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold
                         hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : (
                <>
                  {editingProduct ? "Update Product" : "Create Product"}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold
                         hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              Cancel
            </button>
          </div>

        </form>
        </div>

      </div>

    </div>

  </div>
)}


      {/* Custom Scrollbar Styles */}
      <style>{`
        /* Webkit browsers (Chrome, Safari, Edge) */
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
          margin: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #3b82f6, #8b5cf6);
          border-radius: 10px;
          border: 2px solid #f1f5f9;
          transition: all 0.3s ease;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #2563eb, #7c3aed);
          border-color: #e2e8f0;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:active {
          background: linear-gradient(180deg, #1d4ed8, #6d28d9);
        }

        /* Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #3b82f6 #f1f5f9;
        }

        /* Smooth scroll behavior */
        .custom-scrollbar {
          scroll-behavior: smooth;
          overflow-y: auto;

        }

        .custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #3b82f6 #f1f5f9;
  scroll-behavior: smooth;
  overflow-y: auto;
}


        /* Form input focus effects */
        .form-input:focus {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }

        /* Checkbox animation */
        input[type="checkbox"]:checked {
          animation: checkBounce 0.3s ease;
        }

        @keyframes checkBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        /* Modal animation */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>

    </div>
  );
}
