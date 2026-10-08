import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';

type Article = {
  id: number;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
};

export default function FeedScreen({ voltar }: { voltar: () => void }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => { carregarNoticias(); }, []);

  async function carregarNoticias() {
    setCarregando(true);
    setErro('');
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, content, image_url, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) setErro('Não foi possível carregar as notícias.');
    else setArticles((data || []) as Article[]);
    setCarregando(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={voltar}><Text style={styles.voltar}>← Voltar</Text></Pressable>
        <Text style={styles.titulo}>Feed de Notícias</Text>
        <Text style={styles.subtitulo}>Fique por dentro do que acontece na escola.</Text>
      </View>

      {carregando ? (
        <View style={styles.centralizado}><ActivityIndicator size="large" color="#4f46e5" /></View>
      ) : erro ? (
        <View style={styles.centralizado}>
          <Text style={styles.erro}>{erro}</Text>
          <Pressable style={styles.tentarNovamente} onPress={carregarNoticias}>
            <Text style={styles.tentarNovamenteTexto}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          refreshing={carregando}
          onRefresh={carregarNoticias}
          ListEmptyComponent={<Text style={styles.vazio}>Nenhuma notícia publicada.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.image_url ? <Image source={{ uri: item.image_url }} style={styles.imagem} /> : null}
              <View style={styles.cardConteudo}>
                <Text style={styles.cardTitulo}>{item.title}</Text>
                <Text style={styles.cardTexto}>{item.content}</Text>
                <Text style={styles.data}>{new Date(item.created_at).toLocaleDateString('pt-BR')}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20 },
  voltar: { color: '#4f46e5', fontWeight: '600', marginBottom: 20 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: '#0f172a' },
  subtitulo: { color: '#64748b', marginTop: 5 },
  lista: { padding: 20, paddingTop: 0, paddingBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', marginBottom: 18, borderWidth: 1, borderColor: '#e2e8f0' },
  imagem: { width: '100%', height: 190 },
  cardConteudo: { padding: 18 },
  cardTitulo: { fontSize: 19, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
  cardTexto: { fontSize: 14, color: '#475569', lineHeight: 21 },
  data: { marginTop: 14, color: '#94a3b8', fontSize: 12 },
  centralizado: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  erro: { color: '#dc2626', textAlign: 'center' },
  tentarNovamente: { marginTop: 15, backgroundColor: '#4f46e5', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  tentarNovamenteTexto: { color: '#fff', fontWeight: 'bold' },
  vazio: { textAlign: 'center', color: '#64748b', marginTop: 50 },
});
