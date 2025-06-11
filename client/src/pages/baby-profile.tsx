import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertBabyProfileSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Plus, UserCircle, Calendar, Trash2 } from "lucide-react";
import { Link } from "wouter";

type BabyProfileForm = {
  name: string;
  dateOfBirth: string;
  gender: "male" | "female";
};

export default function BabyProfile() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["/api/baby-profiles"],
    enabled: isAuthenticated,
  });

  const form = useForm<BabyProfileForm>({
    resolver: zodResolver(
      insertBabyProfileSchema.omit({ dateOfBirth: true }).extend({
        dateOfBirth: z.string().min(1, "Date of birth is required"),
      }),
    ),
    defaultValues: {
      name: "",
      dateOfBirth: "",
      gender: "male",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: BabyProfileForm) => {
      const dateObj = new Date(data.dateOfBirth);
      const payload = {
        name: data.name,
        gender: data.gender,
        dateOfBirth: dateObj.toISOString(),
      };
      await apiRequest("POST", "/api/baby-profiles", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/baby-profiles"] });
      toast({
        title: "Success",
        description: "Baby profile created successfully!",
      });
      setIsEditing(false);
      form.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create baby profile",
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
        title: "Success",
        description: "Baby profile deleted successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete baby profile",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const onSubmit = (data: BabyProfileForm) => {
    createMutation.mutate(data);
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="gradient-bg p-4 flex items-center">
        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 mr-3"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <span className="text-white font-medium text-lg">Baby Profile</span>
      </div>

      <div className="p-4 pb-20">
        {/* Add New Profile Button */}
        {!isEditing && (
          <Card className="glass-effect mb-4">
            <CardContent className="p-4">
              <Button
                onClick={() => setIsEditing(true)}
                className="w-full gradient-bg text-white rounded-2xl py-6"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Baby Profile
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Profile Form */}
        {isEditing && (
          <Card className="glass-effect mb-4">
            <CardContent className="p-6">
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Profile Picture Placeholder */}
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center">
                    <Plus className="w-8 h-8 text-pink-400" />
                  </div>
                </div>

                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700">
                    <UserCircle className="w-4 h-4 inline mr-2" />
                    Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter baby's name"
                    className="rounded-xl border-gray-200"
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                {/* Date of Birth Field */}
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-gray-700">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Date Of Birth
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    className="rounded-xl border-gray-200"
                    {...form.register("dateOfBirth")}
                  />
                  {form.formState.errors.dateOfBirth && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.dateOfBirth.message}
                    </p>
                  )}
                </div>

                {/* Gender Selection */}
                <div className="space-y-3">
                  <Label className="text-gray-700">Gender</Label>
                  <RadioGroup
                    value={form.watch("gender")}
                    onValueChange={(value) =>
                      form.setValue("gender", value as "male" | "female")
                    }
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2 bg-blue-50 rounded-full px-6 py-3 flex-1">
                      <RadioGroupItem value="male" id="male" />
                      <Label
                        htmlFor="male"
                        className="text-blue-600 font-medium flex-1 text-center"
                      >
                        MALE
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 bg-pink-50 rounded-full px-6 py-3 flex-1">
                      <RadioGroupItem value="female" id="female" />
                      <Label
                        htmlFor="female"
                        className="text-pink-600 font-medium flex-1 text-center"
                      >
                        FEMALE
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
                    {createMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      form.reset();
                    }}
                    className="flex-1 border-pink-300 text-pink-600 rounded-2xl py-3"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Existing Profiles */}
        {profilesLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading profiles...</p>
          </div>
        ) : profiles.length > 0 ? (
          <div className="space-y-4">
            {profiles.map((profile: any) => (
              <Card key={profile.id} className="glass-effect">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-pink-300 to-purple-300 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {profile.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">
                          {profile.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(profile.dateOfBirth).toLocaleDateString()} •{" "}
                          {profile.gender}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(profile.id)}
                      disabled={deleteMutation.isPending}
                      className="text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !isEditing ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No baby profiles yet. Add your first one!
            </p>
          </div>
        ) : null}
      </div>

      <Navigation />
    </div>
  );
}
