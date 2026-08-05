import { db } from "@/src/lib/firebase";
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  getDocs,
  QuerySnapshot,
  DocumentData
} from "firebase/firestore";
import { Client, ServiceOrder } from "@/lib/types";

const CLIENTS_COLLECTION = "clients";
const ORDERS_COLLECTION = "orders";

/**
 * Strips undefined values from an object so Firestore doesn't throw errors
 * when saving document fields with undefined values.
 */
function cleanUndefined<T extends Record<string, any>>(obj: T): Record<string, any> {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Subscribe to the 'clients' collection in Firestore with real-time updates.
 */
export function subscribeClients(
  onData: (clients: Client[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, CLIENTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const clients: Client[] = snapshot.docs.map((d) => ({
        ...(d.data() as Client),
        id: d.id || (d.data() as Client).id,
      }));
      onData(clients);
    },
    (error) => {
      console.error("Firestore clients subscription error:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Subscribe to the 'orders' collection in Firestore with real-time updates.
 */
export function subscribeOrders(
  onData: (orders: ServiceOrder[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, ORDERS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const orders: ServiceOrder[] = snapshot.docs.map((d) => ({
        ...(d.data() as ServiceOrder),
        id: d.id || (d.data() as ServiceOrder).id,
      }));
      onData(orders);
    },
    (error) => {
      console.error("Firestore orders subscription error:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Save or update a Client in Firestore.
 */
export async function saveClientToFirestore(client: Client): Promise<void> {
  try {
    const docRef = doc(db, CLIENTS_COLLECTION, client.id);
    await setDoc(docRef, cleanUndefined(client), { merge: true });
  } catch (error) {
    console.error("Error saving client to Firestore:", error);
    throw error;
  }
}

/**
 * Delete a Client from Firestore.
 */
export async function deleteClientFromFirestore(clientId: string): Promise<void> {
  try {
    const docRef = doc(db, CLIENTS_COLLECTION, clientId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting client from Firestore:", error);
    throw error;
  }
}

/**
 * Save or update a ServiceOrder in Firestore.
 */
export async function saveOrderToFirestore(order: ServiceOrder): Promise<void> {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, order.id);
    await setDoc(docRef, cleanUndefined(order), { merge: true });
  } catch (error) {
    console.error("Error saving order to Firestore:", error);
    throw error;
  }
}

/**
 * Delete a ServiceOrder from Firestore.
 */
export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting order from Firestore:", error);
    throw error;
  }
}

/**
 * Seed initial clients and orders into Firestore if the collections are currently empty.
 */
export async function seedInitialDataIfEmpty(
  initialClients: Client[],
  initialOrders: ServiceOrder[]
): Promise<void> {
  try {
    const clientsSnap = await getDocs(collection(db, CLIENTS_COLLECTION));
    if (clientsSnap.empty && initialClients.length > 0) {
      console.log("Seeding initial clients into Firestore...");
      for (const client of initialClients) {
        await saveClientToFirestore(client);
      }
    }

    const ordersSnap = await getDocs(collection(db, ORDERS_COLLECTION));
    if (ordersSnap.empty && initialOrders.length > 0) {
      console.log("Seeding initial orders into Firestore...");
      for (const order of initialOrders) {
        await saveOrderToFirestore(order);
      }
    }
  } catch (error) {
    console.warn("Could not seed initial Firestore data:", error);
  }
}
