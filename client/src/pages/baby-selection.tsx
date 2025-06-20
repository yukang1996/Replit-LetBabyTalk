import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, UserCircle, Calendar, Camera, Trash2, Edit3 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBabyProfileSchema } from "@shared/schema";
import { z } from "zod";
import { cn } from "@/lib/utils";

type BabyProfileForm = {
  name: string;
  dateOfBirth: string;
  gender: "male" | "female";
  photoUrl?: string;
};

export default function BabySelection() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedBabyId, setSelectedBabyId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBabyId, setEditingBabyId] = useState<number | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [, navigate] = useLocation();

  // Get referrer from URL params or default to home
  const urlParams = new URLSearchParams(window.location.search);
  const referrer = urlParams.get('from') || '/';

  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["/api/baby-profiles"],
    enabled: isAuthenticated,
  });

  // Type the profiles data
  const typedProfiles = profiles as Array<{
    id: number;
    name: string;
    dateOfBirth: string;
    gender: string;
    photoUrl?: string;
  }>;

  const form = useForm<BabyProfileForm>({
    resolver: zodResolver(insertBabyProfileSchema.omit({ dateOfBirth: true }).extend({
      dateOfBirth: z.string().min(1, "Date of birth is required"),
    })),
    defaultValues: {
      name: "",
      dateOfBirth: "",
      gender: "male",
      photoUrl: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: BabyProfileForm) => {
      const payload = {
        ...data,
        dateOfBirth: new Date(data.dateOfBirth),
      };
      await apiRequest("POST", "/api/baby-profiles", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/baby-profiles"] });
      toast({
        title: t('common.success'),
        description: t('success.profileCreated'),
      });
      setShowCreateForm(false);
      setPhotoPreview(null);
      form.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: t('error.unauthorized'),
          description: t('error.unauthorized'),
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: t('common.error'),
        description: t('error.failedToCreate'),
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: BabyProfileForm }) => {
      const payload = {
        ...data,
        dateOfBirth: new Date(data.dateOfBirth),
      };
      await apiRequest("PUT", `/api/baby-profiles/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/baby-profiles"] });
      toast({
        title: t('common.success'),
        description: "Baby profile updated successfully!",
      });
      // Exit edit mode and return to main view
      setShowCreateForm(false);
      setEditingBabyId(null);
      setPhotoPreview(null);
      form.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: t('error.unauthorized'),
          description: t('error.unauthorized'),
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: t('common.error'),
        description: "Failed to update baby profile",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/baby-profiles/${id}`);
    },
    onSuccess: (_, deletedId) => {
      // Handle selecting next baby if the deleted one was selected
      if (selectedBabyId === deletedId) {
        const remainingProfiles = typedProfiles.filter(p => p.id !== deletedId);
        if (remainingProfiles.length > 0) {
          // Select the next baby in the list
          setSelectedBabyId(remainingProfiles[0].id);
        } else {
          setSelectedBabyId(null);
        }
      }

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/baby-profiles"] });

      toast({
        title: t('common.success'),
        description: t('success.profileDeleted'),
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: t('error.unauthorized'),
          description: t('error.unauthorized'),
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: t('common.error'),
        description: t('error.failedToDelete'),
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: t('error.unauthorized'),
        description: t('error.unauthorized'),
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast, t]);

  useEffect(() => {
    if (typedProfiles.length > 0 && !selectedBabyId) {
      setSelectedBabyId(typedProfiles[0].id);
    }
  }, [typedProfiles, selectedBabyId]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Show preview immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPhotoPreview(result);
      };
      reader.readAsDataURL(file);

      // Create FormData with baby profile image
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('type', 'baby-profile'); // Add the upload type

      // Submit form data to baby profile endpoint
      try {
        let photoUrl = `/uploads/baby-profiles/${file.name}`;

        const response = await fetch('/api/upload-photo', {
          method: 'POST',
          body: formData,
          credentials: 'include', // Include cookies for authentication
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Upload failed');
        }

        const { photoUrl: uploadedUrl } = await response.json();
        photoUrl = uploadedUrl;
        form.setValue("photoUrl", photoUrl);

        toast({
          title: "Photo Updated",
          description: "Baby profile picture updated successfully!",
        });
      } catch (error) {
        console.error('Photo upload failed:', error);
        toast({
          title: "Upload Error",
          description: error instanceof Error ? error.message : "Failed to upload photo. Please try again.",
          variant: "destructive",
        });
        // Fall back to base64
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          form.setValue("photoUrl", result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const onSubmit = (data: BabyProfileForm) => {
    if (editingBabyId) {
      updateMutation.mutate({ id: editingBabyId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEditBaby = (profile: any) => {
    setEditingBabyId(profile.id);
    setShowCreateForm(true);
    form.reset({
      name: profile.name,
      dateOfBirth: new Date(profile.dateOfBirth).toISOString().split('T')[0],
      gender: profile.gender,
      photoUrl: profile.photoUrl || "",
    });
    if (profile.photoUrl) {
      setPhotoPreview(profile.photoUrl);
    }
  };

  const handleCancelEdit = () => {
    setShowCreateForm(false);
    setEditingBabyId(null);
    setPhotoPreview(null);
    form.reset();
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - birth.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks !== 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
  };

  const getBabyAvatar = (profile: any, size: "sm" | "lg" = "sm") => {
    const sizeClasses = size === "lg" ? "w-20 h-20 text-2xl" : "w-12 h-12 text-lg";

    if (profile.photoUrl) {
      return (
        <div className={`${sizeClasses} rounded-full border-2 border-white shadow-md overflow-hidden relative`}>
          <img 
            src={profile.photoUrl} 
            alt={profile.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initial if image fails to load
              const target = e.target as HTMLImageElement;
              const container = target.parentElement;
              if (container) {
                container.innerHTML = `
                  <div class="w-full h-full bg-gradient-to-r from-pink-300 to-purple-300 flex items-center justify-center">
                    <span class="text-white font-medium ${size === "lg" ? "text-2xl" : "text-lg"}">
                      ${profile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                `;
              }
            }}
          />
        </div>
      );
    }
    return (
      <div className={`${sizeClasses} bg-gradient-to-r from-pink-300 to-purple-300 rounded-full flex items-center justify-center border-2 border-white shadow-md`}>
        <span className="text-white font-medium">
          {profile.name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        {/* Header */}
        <div className="gradient-bg p-4 flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/20 mr-3"
            onClick={handleCancelEdit}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="text-white font-medium text-lg">
            {editingBabyId ? "Edit Baby Profile" : t('babyProfile.title')}
          </span>
        </div>

        <div className="p-4 pb-20">
          <Card className="glass-effect">
            <CardContent className="p-6">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Baby Photo Upload */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-24 h-24 bg-white rounded-full overflow-hidden border-4 border-white shadow-lg">
                      {photoPreview ? (
                        <img 
                          src={photoPreview} 
                          alt="Baby Preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-pink-300 to-purple-300 flex items-center justify-center">
                          <Camera className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-pink-500 hover:bg-pink-600"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {photoPreview && (
                  <div className="flex justify-center mt-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                      <p className="text-sm text-green-700 font-medium text-center">
                        ✓ Profile picture updated successfully!
                      </p>
                    </div>
                  </div>
                )}

                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700">
                    <UserCircle className="w-4 h-4 inline mr-2" />
                    {t('babyProfile.name')}
                  </Label>
                  <Input
                    id="name"
                    placeholder={t('babyProfile.enterName')}
                    className="rounded-xl border-gray-200"
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                  )}
                </div>

                {/* Date of Birth Field */}
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-gray-700">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    {t('babyProfile.dateOfBirth')}
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    className="rounded-xl border-gray-200"
                    {...form.register("dateOfBirth")}
                  />
                  {form.formState.errors.dateOfBirth && (
                    <p className="text-sm text-red-500">{form.formState.errors.dateOfBirth.message}</p>
                  )}
                </div>

                {/* Gender Selection */}
                <div className="space-y-3">
                  <Label className="text-gray-700">Gender</Label>
                  <RadioGroup
                    value={form.watch("gender")}
                    onValueChange={(value) => form.setValue("gender", value as "male" | "female")}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2 bg-blue-50 rounded-full px-6 py-3 flex-1">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male" className="text-blue-600 font-medium flex-1 text-center">
                        {t('babyProfile.male')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 bg-pink-50 rounded-full px-6 py-3 flex-1">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female" className="text-pink-600 font-medium flex-1 text-center">
                        {t('babyProfile.female')}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-6">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 gradient-bg text-white rounded-2xl py-3"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : 
                     editingBabyId ? "Update" : t('babyProfile.save')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="flex-1 border-pink-300 text-pink-600 rounded-2xl py-3"
                  >
                    {t('babyProfile.cancel')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="gradient-bg p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/20 mr-3"
            onClick={() => navigate(referrer)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="text-white font-medium">Hi, {user?.firstName || 'User'} 👋</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-white hover:bg-white/20"
        >
          {t('home.premium')}
        </Button>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20">
        {profilesLoading ? (
          <div className="flex justify-center items-center min-h-[50vh]">
            <p className="text-gray-500 text-lg">{t('common.loading')}</p>
          </div>
        ) : typedProfiles.length > 0 ? (
          <div className="space-y-6">
            {/* Page Title */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Your Baby</h2>
              <p className="text-gray-600">Choose which baby profile to use for cry analysis</p>
            </div>

            {/* Baby Profiles Grid */}
            <div className="grid gap-4">
              {typedProfiles.map((profile) => (
                <Card 
                  key={profile.id} 
                  className={cn(
                    "glass-effect cursor-pointer transition-all duration-200 hover:shadow-lg",
                    selectedBabyId === profile.id ? "ring-2 ring-pink-400 shadow-lg" : ""
                  )}
                  onClick={() => setSelectedBabyId(profile.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getBabyAvatar(profile, "lg")}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-lg">{profile.name}</h3>
                          <p className="text-gray-600 capitalize">{profile.gender}</p>
                          <p className="text-sm text-gray-500">Age: {calculateAge(profile.dateOfBirth)}</p>
                          <p className="text-xs text-gray-400">
                            Born: {new Date(profile.dateOfBirth).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-2">
                        {/* Edit Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditBaby(profile);
                          }}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>

                        {/* Delete Button with Confirmation */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:bg-red-50 hover:text-red-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Baby Profile</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete <strong>{profile.name}'s</strong> profile? 
                                This will permanently remove all data associated with this baby profile, 
                                including recordings and analysis history. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(profile.id)}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={deleteMutation.isPending}
                              >
                                {deleteMutation.isPending ? "Deleting..." : "Delete Profile"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        {/* Selected Indicator */}
                        {selectedBabyId === profile.id && (
                          <div className="text-center">
                            <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center mx-auto">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Add New Baby Button */}
            <Card className="glass-effect border-2 border-dashed border-pink-300 hover:border-pink-400 transition-colors">
              <CardContent className="p-4">
                <Button
                  onClick={() => setShowCreateForm(true)}
                  variant="ghost"
                  className="w-full h-20 text-pink-600 hover:bg-pink-50 flex-col space-y-2"
                >
                  <Plus className="w-8 h-8" />
                  <span className="font-medium">Add Another Baby</span>
                </Button>
              </CardContent>
            </Card>

            {/* Continue Button */}
            <div className="fixed bottom-20 left-4 right-4 z-10">
              <Button 
                className="w-full gradient-bg text-white rounded-2xl py-4 text-lg font-medium shadow-lg"
                disabled={!selectedBabyId}
                onClick={() => {
                  // Navigate back to the referrer page, defaulting to record if no specific referrer
                  const destination = referrer === '/settings' ? '/settings' : 
                                    referrer === '/record' ? '/record' : '/record';
                  navigate(destination);
                }}
              >
                Continue with {selectedBabyId ? typedProfiles.find(p => p.id === selectedBabyId)?.name : 'Baby'}
              </Button>
            </div>
          </div>
        ) : (
          // No babies - show welcome state
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <div className="w-32 h-32 bg-gradient-to-r from-pink-300 to-purple-300 rounded-full flex items-center justify-center">
              <UserCircle className="w-16 h-16 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">No Baby Profiles Yet</h2>
              <p className="text-gray-600 mb-6 max-w-md">
                Create your first baby profile to start using LetBabyTalk's cry analysis features
              </p>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="gradient-bg text-white rounded-2xl py-4 px-8 text-lg font-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create First Baby Profile
            </Button>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
}