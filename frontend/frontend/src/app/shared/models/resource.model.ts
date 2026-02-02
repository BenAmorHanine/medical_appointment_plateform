export interface Resource<T> {
  loading: boolean;
  data: T | null;
  error: string | null;
}
