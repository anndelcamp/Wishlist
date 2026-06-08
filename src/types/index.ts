export interface Label {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface Item {
  id: number;
  url: string;
  title: string | null;
  image_url: string | null;
  price: string | null;
  price_raw: number | null;
  description: string | null;
  last_price_check: string | null;
  created_at: string;
  labels: Label[];
  label_ids: number[];
}

export interface Comment {
  id: number;
  item_id: number;
  user_name: string;
  text: string;
  created_at: string;
}
