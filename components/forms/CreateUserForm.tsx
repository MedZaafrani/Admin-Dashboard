"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUser } from "@/lib/services/userService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { FirebaseError } from "firebase/app";

const userSchema = z.object({
  nom: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  telephone: z.string().min(8, "Phone number must be at least 8 characters"),
  localisation: z.string().min(3, "Location must be at least 3 characters"),
});

type UserFormValues = z.infer<typeof userSchema>;

interface CreateUserFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreateUserForm({ onSuccess, onCancel }: CreateUserFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      nom: "",
      email: "",
      password: "",
      telephone: "",
      localisation: "",
    },
  });

  const onSubmit = async (data: UserFormValues) => {
    try {
      setIsSubmitting(true);
      const { password, ...userData } = data;
      await createUser(userData, password);
      toast({
        title: "succès",
        description: "Utilisateur créé avec succès",
      });
      onSuccess?.();
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: "Erreur lors de la création de l'utilisateur",
        variant: "destructive",
      });
      let description = "Erreur lors de la création de l'utilisateur";
      if (error instanceof FirebaseError) {
      if (error.code === "auth/email-already-in-use") {
        description = "Cette adresse email est déjà utilisée.";
      } else if (error.code === "auth/invalid-email") {
        description = "Format d'email invalide.";
      } // add more codes if you like
    }

    toast({
      title: "Échec",
      description,
      variant: "destructive",
    });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Entrez le nom" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="Entrez l'email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe</FormLabel>
              <FormControl>
                <Input {...field} type="password" placeholder="Entrez le Mot de passe" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="telephone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>telephone</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Entrez le numero de telephone" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="localisation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>localisation</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Entrez la localisation" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "en cours..." : "Créer un utilisateur"}
          </Button>
        </div>
      </form>
    </Form>
  );
}