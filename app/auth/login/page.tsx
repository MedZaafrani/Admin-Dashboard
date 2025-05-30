"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/lib/hooks/useAuth";
import { useDarkMode } from "@/lib/hooks/useDarkMode";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sun, Moon } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "S'il vous plaît, mettez une adresse email valide" }),
  password: z
    .string()
    .min(6, { message: "Le mot de passe doit comporter au moins 6 caractères" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { user, loading, signIn, error } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      await signIn(data.email, data.password);
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  // return (
  //   <div className="relative flex items-center justify-center min-h-screen overflow-hidden">
  //     <div className="absolute inset-0 animate-gradient bg-[length:400%_400%] z-0" >
  //     <div className="absolute top-4 right-4">
  //       <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
  //         {isDarkMode ? <Sun /> : <Moon />}
  //       </Button>
  //     </div>

  //     <Card className="w-full max-w-md shadow-lg">
  //       <CardHeader className="space-y-1">
  //         <CardTitle className="text-2xl font-bold text-center">
  //           Connexion Administrateur
  //         </CardTitle>
  //         <CardDescription className="text-center">
  //           Entrez vos identifiants pour accéder au tableau de bord
  //         </CardDescription>
  //       </CardHeader>
  //       <CardContent>
  //         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
  //           <div className="space-y-2">
  //             <Label htmlFor="email">Adresse e-mail</Label>
  //             <Input
  //               id="email"
  //               type="email"
  //               placeholder="your@email.com"
  //               {...form.register("email")}
  //             />
  //             {form.formState.errors.email && (
  //               <p className="text-sm text-destructive">
  //                 {form.formState.errors.email.message}
  //               </p>
  //             )}
  //           </div>
  //           <div className="space-y-2">
  //             <Label htmlFor="password">Mot de passe</Label>
  //             <Input
  //               id="password"
  //               type="password"
  //               placeholder="••••••••"
  //               {...form.register("password")}
  //             />
  //             {form.formState.errors.password && (
  //               <p className="text-sm text-destructive">
  //                 {form.formState.errors.password.message}
  //               </p>
  //             )}
  //           </div>

  //           {error && (
  //             <Alert variant="destructive">
  //               <AlertDescription>{error}</AlertDescription>
  //             </Alert>
  //           )}

  //           <Button type="submit" className="w-full" disabled={isSubmitting}>
  //             {isSubmitting ? "Connexion en cours..." : "Se connecter"}
  //           </Button>
  //         </form>
  //       </CardContent>
  //       <CardFooter className="flex justify-center">
  //         <p className="text-sm text-muted-foreground">
  //           Système de Tableau de Bord Intelligente &copy; {new Date().getFullYear()}
  //         </p>
  //       </CardFooter>
  //     </Card>
  //     </div>
  //   </div>
  // );

  return (
  <div className="relative flex items-center justify-center min-h-screen overflow-hidden">
    {/* ✅ Animated Gradient Background */}
    <div className="absolute inset-0 animate-gradient bg-[length:400%_400%] z-0" />

    {/* ✅ Theme Toggle Button */}
    <div className="absolute top-4 right-4 z-10">
      <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
        {isDarkMode ? <Sun /> : <Moon />}
      </Button>
    </div>

    {/* ✅ Login Card in front of background */}
    <Card className="w-full max-w-md shadow-lg backdrop-blur-sm bg-white/70 dark:bg-black/50 z-10">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Connexion Administrateur
        </CardTitle>
        <CardDescription className="text-center">
          Entrez vos identifiants pour accéder au tableau de bord
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Adresse e-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Connexion en cours..." : "Se connecter"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Système de Tableau de Bord Intelligente &copy; {new Date().getFullYear()}
        </p>
      </CardFooter>
    </Card>
  </div>
);

}
