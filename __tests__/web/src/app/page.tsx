/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import {
  Code,
  MessageCircleQuestion,
  Network,
  RefreshCw,
  Server,
  Shield,
} from "lucide-react";
import Image from "next/image";
import { toast } from "@/hooks/use-toast"; // import shadcn toast

// Interfaces for different API responses
interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
}

export default function HmmApiShowcase() {
  // State for different API call demonstrations
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState({
    user: true,
    products: true,
  });

  // Fetch user data
  const fetchUser = async () => {
    setLoading((prev) => ({ ...prev, user: true }));
    const response = await api.get<User>("/user-profile", {
      finally: () => {
        setLoading((prev) => ({ ...prev, user: false }));
      },
    });

    if (response.success && response.data) {
      setUser(response.data);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    setLoading((prev) => ({ ...prev, products: true }));
    const response = await api.get<Product[]>("/products", {
      finally: () => {
        setLoading((prev) => ({ ...prev, products: false }));
      },
    });

    if (response.success && response.data) {
      setProducts(response.data);
    }
  };

  // Create a new product using hmm-api
  const createProduct = async () => {
    const newProduct = {
      name: "New Tech Gadget",
      price: 299.99,
      description: "Cutting-edge innovation",
    };

    const response = await api.post<Product>("/products", newProduct);

    if (response.success) {
      fetchProducts(); // Refresh product list
    }
  };

  // Create a new product using fetch
  const normalCreateProduct = async () => {
    const newProduct = {
      name: "New Tech Gadget",
      price: 299.99,
      description: "Cutting-edge innovation",
    };

    const response = await fetch("http://localhost:4000/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newProduct),
    });

    const data = await response.json();

    if (response.ok) {
      fetchProducts(); // Refresh product list after successful creation
    } else {
      toast({
        variant: "destructive",
        title: data.title,
        description:
          data?.desc || "Something went wrong. Please try again later.",
      });
    }
  };

  useEffect(() => {
    fetchUser();
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            hmm-api Showcase
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            A powerful, flexible API client for modern web applications
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          {/* User Profile Section */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Server className="mr-3 text-blue-500" />
              <h2 className="text-2xl font-semibold">User Profile</h2>
            </div>
            {loading.user ? (
              <div className="animate-pulse">Loading user data...</div>
            ) : user ? (
              <div className="flex items-center">
                <Image
                  height={500}
                  width={500}
                  src={user.avatar}
                  alt={user.name}
                  className="w-16 h-16 rounded-full mr-4"
                />
                <div>
                  <p className="font-bold">{user.name}</p>
                  <p className="text-gray-500">{user.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-red-500">Failed to load user data</p>
            )}
          </div>

          {/* Products Section */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Network className="mr-3 text-green-500" />
                <h2 className="text-2xl font-semibold">Products</h2>
              </div>
              <button
                onClick={createProduct}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition flex items-center"
              >
                <RefreshCw className="mr-2 w-4 h-4" /> Add Product
              </button>
            </div>
            {loading.products ? (
              <div className="animate-pulse">Loading products...</div>
            ) : (
              <div className="space-y-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="border-b pb-2 last:border-b-0"
                  >
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-gray-500">${product.price}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-12 bg-white shadow-lg rounded-lg p-8">
          <h2 className="text-3xl font-bold text-center mb-8">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <Shield className="mx-auto mb-4 text-purple-500" size={48} />
              <h3 className="font-bold mb-2">Robust Error Handling</h3>
              <p className="text-gray-600">
                Comprehensive error management with customizable toast
                notifications
              </p>
            </div>
            <div className="text-center">
              <Code className="mx-auto mb-4 text-pink-500" size={48} />
              <h3 className="font-bold mb-2">TypeScript Support</h3>
              <p className="text-gray-600">
                Full type safety with generic response handling
              </p>
            </div>
            <div className="text-center">
              <MessageCircleQuestion
                className="mx-auto mb-4 text-orange-500"
                size={48}
              />
              <h3 className="font-bold mb-2">Flexible Configuration</h3>
              <p className="text-gray-600">
                Easily configure base URLs, headers, and authentication
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
