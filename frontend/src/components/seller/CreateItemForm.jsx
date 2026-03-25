import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "../../context/AuthContext"
import { useCreateListing } from "@/hooks/useMarketplace"
import { toast } from "sonner"
import { Loader2, Plus, X, ImageIcon } from "lucide-react"

export const CreateItemForm = ({ onSuccess }) => {
  const { user } = useAuth()
  const createListingMutation = useCreateListing()
  
  const [formData, setFormData] = useState({
    title: "",
    item_description: "",
    price: "",
    condition: "",
    sellerName: "",
    sellerEmail: "",
    sellerPhone: ""
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const handleImageChange = e => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB')
        return
      }

      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    // Reset file input
    const fileInput = document.getElementById('image')
    if (fileInput) fileInput.value = ''
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = () => {
    const errors = []
    
    if (!formData.title.trim()) errors.push('Title is required')
    if (!formData.item_description.trim()) errors.push('Description is required')
    if (!formData.price || parseFloat(formData.price) <= 0) errors.push('Valid price is required')
    if (!formData.condition.trim()) errors.push('Condition is required')
    
    // Check seller info (required for non-logged-in users)
    if (!user) {
      if (!formData.sellerName.trim()) errors.push('Your name is required')
      if (!formData.sellerEmail.trim()) errors.push('Your email is required')
      if (!formData.sellerPhone.trim()) errors.push('Your phone number is required')
    }
    
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form
    const errors = validateForm()
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error))
      return
    }

    try {
      const listingData = {
        title: formData.title.trim(),
        item_description: formData.item_description.trim(),
        price: parseFloat(formData.price),
        condition: formData.condition.trim(),
        // Use logged-in user ID or generate guest ID
        seller_id: user?.id || `guest-${Date.now()}`,
        ...(imageFile && { image: imageFile })
      }

      const result = await createListingMutation.mutateAsync(listingData)
      
      toast.success("Listing created successfully!")
      
      // Reset form
      setFormData({
        title: "",
        item_description: "",
        price: "",
        condition: "",
        sellerName: "",
        sellerEmail: "",
        sellerPhone: ""
      })
      setImageFile(null)
      setImagePreview(null)
      
      // Reset file input
      const fileInput = document.getElementById('image')
      if (fileInput) fileInput.value = ''
      
      // Call success callback
      if (onSuccess) {
        onSuccess()
      }
      
    } catch (error) {
      console.error('Create listing error:', error)
      toast.error(error.message || "Failed to create listing")
    }
  }

  const isLoading = createListingMutation.isPending

  return (
    <Card>
      <CardHeader>
        <CardTitle>List New Item</CardTitle>
        <CardDescription>
          Fill in the details to list your item in the marketplace. No login required!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Details Section */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Item Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Item Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Vintage Study Desk"
                value={formData.title}
                onChange={e => handleInputChange('title', e.target.value)}
                required
                disabled={isLoading}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                {formData.title.length}/100 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item_description">Description *</Label>
              <Textarea
                id="item_description"
                placeholder="Describe your item in detail..."
                value={formData.item_description}
                onChange={e => handleInputChange('item_description', e.target.value)}
                required
                disabled={isLoading}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {formData.item_description.length}/500 characters
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="100.00"
                  value={formData.price}
                  onChange={e => handleInputChange('price', e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition *</Label>
                <Input
                  id="condition"
                  placeholder="e.g., Excellent, Good, Fair"
                  value={formData.condition}
                  onChange={e => handleInputChange('condition', e.target.value)}
                  required
                  disabled={isLoading}
                  maxLength={50}
                />
              </div>
            </div>
          </div>

          {/* Seller Details Section (if not logged in) */}
          {!user && (
            <div>
              <h3 className="font-semibold text-foreground mb-4 pt-4 border-t">Your Contact Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="sellerName">Your Name *</Label>
                <Input
                  id="sellerName"
                  placeholder="Enter your full name"
                  value={formData.sellerName}
                  onChange={e => handleInputChange('sellerName', e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellerEmail">Your Email *</Label>
                <Input
                  id="sellerEmail"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.sellerEmail}
                  onChange={e => handleInputChange('sellerEmail', e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellerPhone">Your Phone *</Label>
                <Input
                  id="sellerPhone"
                  type="tel"
                  placeholder="+91-XXXXXXXXXX"
                  value={formData.sellerPhone}
                  onChange={e => handleInputChange('sellerPhone', e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <Alert className="mt-4">
                <AlertDescription>
                  Your contact information will be visible to interested buyers so they can reach out to you.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Image Section */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 pt-4 border-t">Item Image</h3>
            
            <div className="space-y-2">
              <Label htmlFor="image">Item Image (Optional)</Label>
              {!imagePreview ? (
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="image"
                    className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground text-center">
                      Click to upload image
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, WEBP (Max 5MB)
                    </span>
                  </label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                    disabled={isLoading}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {imageFile?.name}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating listing...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Listing
              </>
            )}
          </Button>
          
          {createListingMutation.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {createListingMutation.error.message || "Failed to create listing"}
              </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
