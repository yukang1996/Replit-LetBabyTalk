import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, User, Camera, Mail, Phone, AlertTriangle } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Account() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse user role to handle "other: xxxxx" format
  const parseUserRole = (role: string | undefined) => {
    if (!role) return { type: "parent", custom: "" };
    if (role.startsWith("other:")) {
      return { type: "other", custom: role.substring(6).trim() };
    }
    return { type: role, custom: "" };
  };

  const parsedRole = parseUserRole(user?.userRole);
  const [userRole, setUserRole] = useState(parsedRole.type);
  const [customRole, setCustomRole] = useState(parsedRole.custom);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  const userRoles = [
    { value: "parent", label: "Parent", icon: "👨‍👩‍👧‍👦" },
    { value: "nanny", label: "Nanny", icon: "👩‍🍼" },
    { value: "nurse", label: "Nurse", icon: "👩‍⚕️" },
    { value: "doctor", label: "Doctor", icon: "👨‍⚕️" },
    { value: "other", label: "Other", icon: "👤" },
  ];

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { userRole: string; profileImage?: File }) => {
      if (data.profileImage) {
        // If there's a profile image, use FormData
        const formData = new FormData();
        formData.append('userRole', data.userRole);
        formData.append('profileImage', data.profileImage);

        const response = await fetch('/api/auth/profile', {
          method: 'PUT',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to update profile');
        }

        return response.json();
      } else {
        // If no image, send JSON data
        const response = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userRole: data.userRole }),
        });

        if (!response.ok) {
          throw new Error('Failed to update profile');
        }

        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Deactivate account mutation
  const deactivateAccountMutation = useMutation({
    mutationFn: async () => {
      // Placeholder API call - replace with actual endpoint
      const response = await apiRequest("DELETE", "/api/auth/account");
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Account Deactivated",
        description: "Your account has been permanently deleted.",
      });
      // Clear all local storage and redirect to signin
      localStorage.clear();
      queryClient.clear();
      navigate("/signin");
    },
    onError: (error: any) => {
      toast({
        title: "Deactivation Failed",
        description: error.message || "Failed to deactivate account",
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = () => {
    const roleToSubmit = userRole === "other" ? `other: ${customRole}` : userRole;
    updateProfileMutation.mutate({
      userRole: roleToSubmit,
      profileImage: profileImage || undefined,
    });
  };

  const handleDeactivateConfirm = () => {
    if (confirmText.toLowerCase() === "confirm") {
      deactivateAccountMutation.mutate();
    } else {
      toast({
        title: "Invalid Confirmation",
        description: "Please type 'Confirm' to proceed with account deactivation.",
        variant: "destructive",
      });
    }
  };

  if (isLoading || !isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="gradient-bg p-4 flex items-center">
        <Link href="/settings">
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 mr-3">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <span className="text-white font-medium text-lg">Account Settings</span>
      </div>

      <div className="p-4 pb-20">
        {/* Profile Picture Section */}
        <Card className="glass-effect mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Profile Picture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-24 h-24 bg-white rounded-full overflow-hidden border-4 border-white shadow-lg">
                  {profileImagePreview ? (
                    <img 
                      src={profileImagePreview} 
                      alt="Profile Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : user?.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-pink-300 to-purple-300 flex items-center justify-center">
                      <User className="w-12 h-12 text-white" />
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-pink-500 hover:bg-pink-600"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <p className="text-sm text-gray-600 text-center">
                Click the camera icon to change your profile picture
              </p>
            </div>
          </CardContent>
        </Card>

        {/* User Status */}
        <Card className="glass-effect mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">User Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Select your role</Label>
              <div className="grid grid-cols-2 gap-3">
                {userRoles.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setUserRole(role.value)}
                    className={`flex items-center space-x-3 p-3 rounded-xl border-2 transition-all ${
                      userRole === role.value
                        ? "border-pink-500 bg-pink-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <span className="text-2xl">{role.icon}</span>
                    <span className="font-medium text-gray-700">{role.label}</span>
                  </button>
                ))}
              </div>

              {userRole === "other" && (
                <div className="mt-3">
                  <Label htmlFor="customRole" className="text-gray-700">
                    Specify your role
                  </Label>
                  <Input
                    id="customRole"
                    type="text"
                    placeholder="Enter your role"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    className="rounded-xl border-gray-200 mt-2"
                  />
                </div>
              )}
            </div>

            <Button
              onClick={handleProfileUpdate}
              disabled={updateProfileMutation.isPending}
              className="w-full gradient-bg text-white rounded-2xl py-3"
            >
              {updateProfileMutation.isPending ? "Updating..." : "Update Status"}
            </Button>
          </CardContent>
        </Card>

        {/* Account Information (Read-only) */}
        <Card className="glass-effect mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.email && (
              <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-xl">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
            )}

            {user?.phone && (
              <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-xl">
                <Phone className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Phone</p>
                  <p className="text-sm text-gray-600">{user.phone}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="glass-effect border-red-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-red-600 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Once you deactivate your account, there is no going back. Please be certain.
            </p>
            <Button
              onClick={() => setShowDeactivateModal(true)}
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50 rounded-2xl py-3"
            >
              Deactivate Account
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Deactivation Confirmation Modal */}
      <Dialog open={showDeactivateModal} onOpenChange={setShowDeactivateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Deactivate Account
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Your account and all associated data will be permanently deleted. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-gray-700">
                Type "Confirm" to proceed:
              </Label>
              <Input
                id="confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Confirm"
                className="rounded-xl border-gray-200"
              />
            </div>
          </div>

          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeactivateModal(false);
                setConfirmText("");
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeactivateConfirm}
              disabled={deactivateAccountMutation.isPending || confirmText.toLowerCase() !== "confirm"}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              {deactivateAccountMutation.isPending ? "Deactivating..." : "Deactivate Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}