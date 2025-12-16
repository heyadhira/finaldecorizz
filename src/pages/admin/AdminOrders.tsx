import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from '../../context/AuthContext';
import { projectId } from "../../utils/supabase/info";
import { toast } from "sonner";
import AdminSidebar from "./AdminSidebar";

export default function AdminOrders() {
  const { accessToken } = useContext(AuthContext);

  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/orders`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error("Fetch orders error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    status: string,
    paymentStatus?: string
  ) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/orders/${orderId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ status, paymentStatus }),
        }
      );

      if (response.ok) {
        toast.success("Order updated");
        fetchOrders();
      } else {
        toast.error("Failed to update order");
      }
    } catch (error) {
      console.error("Update order error:", error);
      toast.error("Failed to update order");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <AdminSidebar onSidebarWidthChange={(w) => setSidebarWidth(w)} />

      {/* Main Content */}
      <div className="w-full pt-16 p-4 md:p-8" style={{ marginLeft: isDesktop ? sidebarWidth : 0 }}>
        <h1 className="text-3xl font-semibold text-gray-900 mb-8">
          Manage Orders
        </h1>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-12 w-12 border-b-2 border-gray-800 rounded-full animate-spin" />
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order: any) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Order #{order.id}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-2xl font-semibold text-gray-900">
                    ₹{order.total.toFixed(2)}
                  </p>
                </div>

                {/* Customer + Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-gray-600 mb-1 font-medium">Customer</p>
                    <p className="text-gray-900">{order.shippingAddress.fullName}</p>
                    <p className="text-gray-600">{order.shippingAddress.phone}</p>
                  </div>

                  <div>
                    <p className="text-gray-600 mb-1 font-medium">
                      Shipping Address
                    </p>
                    <p className="text-gray-900">
                      {order.shippingAddress.address}, {order.shippingAddress.city}
                      <br />
                      {order.shippingAddress.state} {order.shippingAddress.zipCode}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-4">
                  <p className="text-gray-600 font-medium mb-2">Order Items</p>
                  {order.items.map((item: any, index: number) => (
                    <p key={index} className="text-gray-900">
                      {item.productName} — {item.color} — {item.size} (x
                      {item.quantity}) — ₹
                      {(item.price * item.quantity).toFixed(2)}
                    </p>
                  ))}
                </div>

                {/* Status Controls */}
                <div className="flex gap-6 mt-4">
                  {/* Delivery Status */}
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">
                      Delivery Status
                    </label>
                    <select
                      value={order.status}
                      onChange={(e) =>
                        updateOrderStatus(order.id, e.target.value)
                      }
                      className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Payment Status */}
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">
                      Payment Status
                    </label>
                    <select
                      value={order.paymentStatus}
                      onChange={(e) =>
                        updateOrderStatus(
                          order.id,
                          order.status,
                          e.target.value
                        )
                      }
                      className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-12 text-gray-500 text-lg">
            No orders found
          </p>
        )}
      </div>
    </div>
  );
}
