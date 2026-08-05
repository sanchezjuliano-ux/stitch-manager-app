export type ViewTab = 'quotes' | 'orders' | 'clients' | 'inventory' | 'finance' | 'analytics' | 'services';

export type DisplayViewMode = 'large' | 'medium' | 'small' | 'list';

export type QuoteStatus = 'Pendente' | 'Aprovado' | 'Recusado';

export type ProductType = 'virtual' | 'fisico';

export interface QuoteMaterialItem {
  inventoryItemId?: string;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalCost: number;
  isFractioned?: boolean;
  fractionSize?: number;
  fractionUnit?: string;
  fractionQuantity?: number;
  pricePerFractionUnit?: number;
}

export interface Quote {
  id: string; // e.g. "#105"
  clientId: string;
  clientName: string;
  date: string;
  productType?: ProductType;
  itemQuantity?: number;
  unitPrice?: number;
  embroiderySize: string; // e.g. "10x10cm"
  hoopSize: string; // e.g. "13x18cm"
  fabricType: string; // e.g. "Algodão"
  fabricColor: string; // e.g. "Branco"
  description: string;
  estimatedValue: number;
  matrixUrl?: string;
  matrixFileName?: string;
  status: QuoteStatus;
  stitchCount?: number;
  quoteMaterials?: QuoteMaterialItem[];
  machineTimeMinutes?: number;
  machineHourlyRate?: number;
  machineCost?: number;
  laborCost?: number;
}

export type OrderStatus = 'Aguardando' | 'Em Andamento' | 'Concluído' | 'Cancelado';

export interface OrderStep {
  title: string;
  date?: string;
  completed: boolean;
  type?: 'approval' | 'payment1' | 'payment2' | 'single_payment' | 'shipping';
  amount?: number;
}

export interface ServiceOrder {
  id: string; // e.g. "OS #25002"
  clientName: string;
  clientId: string;
  quoteId?: string;
  productType?: ProductType;
  status: OrderStatus;
  creationDate: string;
  deliveryDate: string; // Previsão de entrega
  actualDeliveryDate?: string; // Data de entrega definitiva ao confirmar envio
  totalValue: number;
  paidValue: number;
  isSinglePayment: boolean;
  steps: OrderStep[];
  description: string;
  notes?: string;
  imageUrl?: string;
  embroiderySize?: string;
  hoopSize?: string;
  fabricType?: string;
  fabricColor?: string;
  stitchCount?: number;
  matrixFileName?: string;
  matrixDeliveryPreferences?: string[];
  matrixDeliveryOther?: string;
  machineFileFormat?: string;
}

export interface EmbroideryMachine {
  brand: string;
  model: string;
  hoops: string;
  fileFormat: string;
}

export interface Client {
  id: string;
  name: string;
  documentType: 'CPF' | 'CNPJ' | 'Outro';
  documentNumber: string;
  contactPerson?: string;
  category?: 'Empresa' | 'Particular' | 'Atacado' | 'Escola';
  email: string;
  phone: string;
  cityState: string;
  city?: string;
  state?: string;
  country?: string;
  birthDate?: string;
  instagram?: string;
  facebook?: string;
  hasEmbroideryMachine: boolean;
  embroideryMachines?: EmbroideryMachine[];
  matrixDeliveryPreferences?: string[];
  matrixDeliveryOther?: string;
  activeOrdersCount: number;
  avatarInitials: string;
  avatarBgColor?: string;
}

export type MaterialTag = 'Alta Rotação' | 'Estoque Baixo' | 'Em Falta' | 'Normal';

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: string;
  imageUrl: string;
  tag: MaterialTag;
  stockQuantity: number;
  unit: string;
  minStockLevel: number;
  colorHex?: string;
  colorName?: string;
  pricePerUnit: number;
  hasFractioning?: boolean;
  fractionSize?: number;
  fractionUnit?: string;
  pricePerFractionUnit?: number;
}

export type TransactionType = 'entrada' | 'saida';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  isUrgent?: boolean;
  category: 'Pagamento OS' | 'Sinal OS' | 'Compra de Linhas' | 'Manutenção' | 'Insumos' | 'Outros';
}

export interface ExecutedService {
  id: string;
  code: string;
  name: string;
  category: string;
  subcategory?: string;
  description: string;
  defaultPrice: number;
  unit: string;
  productType?: ProductType;
  estimatedStitchCount?: number;
  suggestedEmbroiderySize?: string;
  suggestedHoopSize?: string;
  estimatedTimeMinutes?: number;
  imageUrl?: string;
  tags?: string[];
  timesExecuted?: number;
  lastUsedDate?: string;
}
