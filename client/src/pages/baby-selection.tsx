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
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ArrowLeft, Plus, UserCircle, Calendar, Camera } from "lucide-react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBabyProfileSchema } from "@shared/schema";
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
    resolver: zodResolver(insertBabyProfileSchema.extend({
      dateOfBirth: insertBabyProfileSchema.shape.dateOfBirth.transform((date) => 
        new Date(date)
      ),
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
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    return `${diffWeeks} weeks`;
  };

  const getBabyAvatar = (profile: any) => {
    if (profile.photoUrl) {
      return (
        <img 
          src={profile.photoUrl} 
          alt={profile.name}
          className="w-12 h-12 rounded-full object-cover"
        />
      );
    }
    return (
      <div className="w-12 h-12 bg-gradient-to-r from-pink-300 to-purple-300 rounded-full flex items-center justify-center">
        <span className="text-white font-medium text-lg">
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
      <div className="min-h-screen">
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
                      className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-pink-200 transition-colors"
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
    <div className="min-h-screen">
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
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <Card className="w-full max-w-md glass-effect">
          <CardContent className="pt-8 pb-8">
            {/* Baby Carousel or List */}
            {profilesLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">{t('common.loading')}</p>
              </div>
            ) : typedProfiles.length > 0 ? (
              <div className="space-y-6">
                {/* Baby Selection Carousel */}
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Select Your Baby</h3>
                  
                  {typedProfiles.length === 1 ? (
                    // Single baby - no carousel needed
                    <div className="flex flex-col items-center space-y-4">
                      {getBabyAvatar(typedProfiles[0])}
                      <div className="text-center">
                        <p className="font-medium text-gray-800">{typedProfiles[0].name}</p>
                        <p className="text-sm text-gray-500">Age: {calculateAge(typedProfiles[0].dateOfBirth)}</p>
                      </div>
                    </div>
                  ) : (
                    // Multiple babies - show carousel
                    <Carousel className="w-full max-w-xs mx-auto">
                      <CarouselContent>
                        {typedProfiles.map((profile) => (
                          <CarouselItem key={profile.id}>
                            <div 
                              className={cn(
                                "flex flex-col items-center space-y-4 p-4 rounded-lg cursor-pointer transition-colors",
                                selectedBabyId === profile.id ? "bg-pink-50" : "hover:bg-gray-50"
                              )}
                              onClick={() => setSelectedBabyId(profile.id)}
                            >
                              {getBabyAvatar(profile)}
                              <div className="text-center">
                                <p className="font-medium text-gray-800">Name: {profile.name}</p>
                                <p className="text-sm text-gray-500">Age: {calculateAge(profile.dateOfBirth)}</p>
                              </div>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious />
                      <CarouselNext />
                    </Carousel>
                  )}
                </div>

                {/* Recording Button */}
                <div className="text-center">
                  <Link href="/">
                    <Button className="w-32 h-32 rounded-full gradient-bg text-white hover:opacity-90 transition-opacity">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                        <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
                      </div>
                    </Button>
                  </Link>
                  <p className="text-gray-600 mt-4">{t('home.tapToRecord')}</p>
                </div>
              </div>
            ) : (
              // No babies - show add baby option
              <div className="text-center space-y-6">
                <p className="text-gray-600 mb-6">{t('babyProfile.noProfiles')}</p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="w-32 h-32 rounded-full bg-pink-100 hover:bg-pink-200 text-pink-600 border-2 border-dashed border-pink-300"
                >
                  <Plus className="w-12 h-12" />
                </Button>
                <p className="text-gray-600">{t('babyProfile.add')}</p>
              </div>
            )}

            {/* Add Another Baby Button */}
            {typedProfiles.length > 0 && (
              <div className="text-center mt-8">
                <Button
                  onClick={() => setShowCreateForm(true)}
                  variant="outline"
                  className="w-16 h-16 rounded-full border-pink-300 text-pink-600 hover:bg-pink-50"
                >
                  <Plus className="w-6 h-6" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Navigation />
    </div>
  );
}