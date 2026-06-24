// 회사 시뮬레이션 타입 (LIB-01, BE-02 기반)

export interface Product {
  id: number;
  name: string;
  perBox: number;    // 박스당 개수
}

export interface CompanySimulationParams {
  palletTypeId: number;
  outerBoxTypeId: number;
  innerBoxTypeId: number;
  productId: number;
  quantity: number;  // 총 생산 수량
}

export interface PalletLayer {
  layerIndex: number;
  row: number;
  col: number;
}

export interface CompanySimulationResult {
  palletTypeName: string;
  outerBoxName: string;
  innerBoxName: string;
  productName: string;
  totalQuantity: number;
  boxesPerPallet: number;
  boxesPerLayer: number;
  layers: number;
  totalPallets: number;
  remainderBoxes: number;
  layout: PalletLayer[];
}
