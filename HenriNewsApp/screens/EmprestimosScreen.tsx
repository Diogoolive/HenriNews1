import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';

type Loan = {
  id: number;
  code: string;
  status: 'requested' | 'borrowed' | 'returned' | 'cancelled';
  requested_at: string;
  due_date: string;
  returned_at: string | null;
  books: any;
};

export default function EmprestimosScreen({ voltar }: { voltar: () => void }) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoans([]);
      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from('loans')
      .select('id, code, status, requested_at, due_date, returned_at, books(title, author)')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false });

    if (error) console.log(error);
    else setLoans((data || []) as Loan[]);

    setCarregando(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={voltar}><Text style={styles.voltar}>← Voltar</Text></Pressable>
        <Text style={styles.titulo}>Meus Empréstimos</Text>
        <Text style={styles.subtitulo}>Acompanhe vouchers, status e prazos.</Text>
      </View>

      {carregando ? (
        <View style={styles.centralizado}><ActivityIndicator size="large" color="#4f46e5" /></View>
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          onRefresh={carregar}
          refreshing={carregando}
          ListEmptyComponent={<Text style={styles.vazio}>Você ainda não possui empréstimos.</Text>}
          renderItem={({ item }) => {
            const livro = Array.isArray(item.books) ? item.books[0] : item.books;
            const atrasado =
              item.status !== 'returned' &&
              item.status !== 'cancelled' &&
              new Date(`${item.due_date}T23:59:59`) < new Date();

            return (
              <View style={styles.card}>
                <View style={styles.topoCard}>
                  <Text style={styles.livro}>{livro?.title || 'Livro'}</Text>
                  <View style={[styles.status, atrasado && styles.statusAtrasado]}>
                    <Text style={[styles.statusTexto, atrasado && styles.statusTextoAtrasado]}>
                      {atrasado ? 'Atrasado' : statusLabel(item.status)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.autor}>{livro?.author || ''}</Text>
                <Text style={styles.info}>Voucher: {item.code}</Text>
                <Text style={styles.info}>Solicitado em: {formatarData(item.requested_at)}</Text>
                <Text style={[styles.info, atrasado && styles.textoAtrasado]}>
                  Prazo: {formatarData(item.due_date)}
                </Text>
                {item.returned_at && (
                  <Text style={styles.info}>Devolvido em: {formatarData(item.returned_at)}</Text>
                )}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

function statusLabel(status: Loan['status']) {
  return ({ requested: 'Solicitado', borrowed: 'Retirado', returned: 'Devolvido', cancelled: 'Cancelado' })[status];
}

function formatarData(valor: string) {
  const data = valor.length === 10 ? new Date(`${valor}T12:00:00`) : new Date(valor);
  return data.toLocaleDateString('pt-BR');
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingBottom: 10 },
  voltar: { color: '#4f46e5', fontWeight: '600', marginBottom: 18 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: '#0f172a' },
  subtitulo: { color: '#64748b', marginTop: 5 },
  lista: { padding: 20, paddingTop: 10, paddingBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  topoCard: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' },
  livro: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  autor: { color: '#64748b', marginTop: 4, marginBottom: 12 },
  info: { color: '#475569', marginTop: 4 },
  status: { backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statusTexto: { color: '#92400e', fontSize: 12, fontWeight: '700' },
  statusAtrasado: { backgroundColor: '#fee2e2' },
  statusTextoAtrasado: { color: '#b91c1c' },
  textoAtrasado: { color: '#b91c1c', fontWeight: '700' },
  centralizado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  vazio: { textAlign: 'center', color: '#64748b', marginTop: 40 },
});
