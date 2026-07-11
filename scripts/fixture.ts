// 검증 스크립트용 픽스처 하이드레이션 (Phase 6)
// 운영은 /api/company/master(DB)로 주입되지만, 스크립트는 네트워크 없이
// lib/company/master.json 픽스처를 MasterData로 조립해 주입한다.
// import 부수효과로 실행되므로 각 테스트 파일 최상단에서 import 한다.

import type {
  MasterData,
  InnerBoxKind,
  OuterBoxKind,
} from '@/types/company';
import { hydrateMasterData } from '@/lib/company/data';
import master from '@/lib/company/master.json';

const fixture: MasterData = {
  products: master.products.map((p) => ({
    size: p.size,
    meter: p.meter,
    fullOuterQty: p.fullOuterQty,
    fullOuterWeight: p.fullOuterWeight,
    innerCapacity: {
      145: p.innerCapacity['145'],
      95: p.innerCapacity['95'],
      60: p.innerCapacity['60'],
    },
  })),
  innerBoxes: master.innerBoxes.map((b) => ({
    kind: b.kind as InnerBoxKind,
    w: b.w,
    d: b.d,
    h: b.h,
    tare: b.tare,
  })),
  outerBoxes: master.outerBoxes.map((b) => ({
    kind: b.kind as OuterBoxKind,
    label: b.label,
    w: b.w,
    d: b.d,
    h: b.h,
    tare: b.tare,
    perLayerUnit: b.perLayerUnit,
    capacityUnit: b.capacityUnit,
  })),
  pallets: master.pallets.map((p) => ({
    id: p.id,
    label: p.label,
    w: p.w,
    d: p.d,
    h: p.h,
    tare: p.tare,
    boxesPerLayer: p.boxesPerLayer,
    layout: {
      cols: p.layout.cols,
      rows: p.layout.rows,
      rotated: p.layout.rotated,
    },
  })),
  innerUnits: {
    145: { outer: master.innerUnits['145'].outer, courier: master.innerUnits['145'].courier },
    95: { outer: master.innerUnits['95'].outer, courier: master.innerUnits['95'].courier },
    60: { outer: master.innerUnits['60'].outer, courier: master.innerUnits['60'].courier },
  },
};

hydrateMasterData(fixture);
