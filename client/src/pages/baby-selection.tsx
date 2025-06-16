
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
import { Link } from "wouter";
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
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/baby-profiles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/baby-profiles"] });
      toast({
        title: t('common.success'),
        description: t('success.profileDeleted'),
      });
      // Reset selected baby if it was deleted
      if (selectedBabyId && typedProfiles.length > 1) {
        const remainingProfiles = typedProfiles.filter(p => p.id !== selectedBabyId);
        if (remainingProfiles.length > 0) {
          setSelectedBabyId(remainingProfiles[0].id);
        } else {
          setSelectedBabyId(null);
        }
      }
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

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPhotoPreview(result);
        form.setValue("photoUrl", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: BabyProfileForm) => {
    createMutation.mutate(data);
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
        <img 
          src={profile.photoUrl} 
          alt={profile.name}
          className={`${sizeClasses} rounded-full object-cover border-2 border-white shadow-md`}
        />
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
            onClick={() => {
              setShowCreateForm(false);
              setPhotoPreview(null);
              form.reset();
            }}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="text-white font-medium text-lg">{t('babyProfile.title')}</span>
        </div>

        <div className="p-4 pb-20">
          <Card className="glass-effect">
            <CardContent className="p-6">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Baby Photo Upload */}
                <div className="flex justify-center">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-pink-200 transition-colors border-2 border-dashed border-pink-300"
                    >
                      {photoPreview ? (
                        <img 
                          src={photoPreview} 
                          alt="Baby preview"
                          className="w-24 h-24 rounded-full object-cover"
                        />
                      ) : (
                        <Camera className="w-8 h-8 text-pink-400" />
                      )}
                    </label>
                  </div>
                </div>

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
                    disabled={createMutation.isPending}
                    className="flex-1 gradient-bg text-white rounded-2xl py-3"
                  >
                    {createMutation.isPending ? "Saving..." : t('babyProfile.save')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setPhotoPreview(null);
                      form.reset();
                    }}
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
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 mr-3">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
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
              <Link href="/">
                <Button 
                  className="w-full gradient-bg text-white rounded-2xl py-4 text-lg font-medium shadow-lg"
                  disabled={!selectedBabyId}
                >
                  Continue with {selectedBabyId ? typedProfiles.find(p => p.id === selectedBabyId)?.name : 'Baby'}
                </Button>
              </Link>
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
