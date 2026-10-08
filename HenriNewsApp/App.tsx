import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { Session } from '@supabase/supabase-js';

import { supabase } from './lib/supabase';
import FeedScreen from './screens/FeedScreen';
import BibliotecaScreen from './screens/BibliotecaScreen';
import EmprestimosScreen from './screens/EmprestimosScreen';
import EnquetesScreen from './screens/EnquetesScreen';
import SuporteScreen from './screens/SuporteScreen';
import GestaoScreen from './screens/GestaoScreen';
import CadastroScreen from './screens/CadastroScreen';
import RecuperarSenhaScreen from './screens/RecuperarSenhaScreen';

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: 'student' | 'admin';
};

type Tela =
  | 'home'
  | 'feed'
  | 'biblioteca'
  | 'emprestimos'
  | 'enquetes'
  | 'suporte'
  | 'gestao';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [entrando, setEntrando] = useState(false);
  const [telaAtual, setTelaAtual] = useState<Tela>('home');
  const [modoAuth, setModoAuth] = useState<'login' | 'cadastro' | 'recuperar'>('login');

  useEffect(() => {
    iniciarApp();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, novaSession) => {
      setSession(novaSession);

      if (novaSession?.user) {
        carregarPerfil(novaSession.user.id);
      } else {
        setProfile(null);
        setTelaAtual('home');
        setModoAuth('login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function iniciarApp() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      if (session?.user) await carregarPerfil(session.user.id);
    } catch (error) {
      console.log('Erro ao iniciar:', error);
    } finally {
      setCarregando(false);
    }
  }

  async function carregarPerfil(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.log('Erro ao carregar perfil:', error);
      return;
    }

    if (data) setProfile(data as Profile);
  }

  async function entrar() {
    if (!email.trim() || !senha) {
      Alert.alert('Atenção', 'Preencha o e-mail e a senha.');
      return;
    }

    try {
      setEntrando(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: senha,
      });

      if (error) {
        Alert.alert('Erro ao entrar', error.message);
        return;
      }

      setSenha('');
      setTelaAtual('home');
    } catch (error) {
      console.log(error);
      Alert.alert('Erro', 'Não foi possível realizar o login.');
    } finally {
      setEntrando(false);
    }
  }

  async function sair() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Erro', 'Não foi possível sair da conta.');
      return;
    }

    setSession(null);
    setProfile(null);
    setEmail('');
    setSenha('');
    setTelaAtual('home');
    setModoAuth('login');
  }

  if (carregando) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Carregando HenriNews...</Text>
      </SafeAreaView>
    );
  }

  if (!session && modoAuth === 'cadastro') {
    return <CadastroScreen voltar={() => setModoAuth('login')} />;
  }

  if (!session && modoAuth === 'recuperar') {
    return <RecuperarSenhaScreen voltar={() => setModoAuth('login')} />;
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loginCard}>
          <Text style={styles.logo}>HenriNews</Text>
          <Text style={styles.titulo}>Acesse sua conta</Text>
          <Text style={styles.subtitulo}>
            Entre para acessar notícias, biblioteca e enquetes.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
          />

          <Pressable
            style={[styles.botaoEntrar, entrando && styles.botaoDesativado]}
            onPress={entrar}
            disabled={entrando}
          >
            <Text style={styles.botaoEntrarTexto}>
              {entrando ? 'Entrando...' : 'Entrar'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.botaoRecuperar}
            onPress={() => setModoAuth('recuperar')}
          >
            <Text style={styles.botaoRecuperarTexto}>Esqueci minha senha</Text>
          </Pressable>

          <Pressable
            style={styles.botaoCadastro}
            onPress={() => setModoAuth('cadastro')}
          >
            <Text style={styles.botaoCadastroTexto}>Criar conta</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (telaAtual === 'feed') {
    return <FeedScreen voltar={() => setTelaAtual('home')} />;
  }

  if (telaAtual === 'biblioteca') {
    return <BibliotecaScreen voltar={() => setTelaAtual('home')} />;
  }

  if (telaAtual === 'emprestimos') {
    return <EmprestimosScreen voltar={() => setTelaAtual('home')} />;
  }

  if (telaAtual === 'enquetes') {
    return <EnquetesScreen voltar={() => setTelaAtual('home')} />;
  }

  if (telaAtual === 'suporte') {
    return <SuporteScreen voltar={() => setTelaAtual('home')} />;
  }

  if (telaAtual === 'gestao' && profile?.role === 'admin') {
    return <GestaoScreen voltar={() => setTelaAtual('home')} />;
  }

  return (
    <SafeAreaView style={styles.homeContainer}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.homeContent}>
        <View style={styles.header}>
          <View style={styles.headerTextArea}>
            <Text style={styles.logoPequeno}>HenriNews</Text>
            <Text style={styles.bemVindo}>
              Olá, {profile?.full_name || session.user.email}
            </Text>
            <Text style={styles.tipoUsuario}>
              {profile?.role === 'admin' ? 'Gestor' : 'Aluno/Responsável'}
            </Text>
          </View>

          <Pressable style={styles.botaoSair} onPress={sair}>
            <Text style={styles.botaoSairTexto}>Sair</Text>
          </Pressable>
        </View>

        <Text style={styles.secaoTitulo}>Menu principal</Text>

        <View style={styles.menuGrid}>
          <MenuCard
            titulo="Feed"
            descricao="Veja as notícias da escola."
            onPress={() => setTelaAtual('feed')}
          />
          <MenuCard
            titulo="Biblioteca"
            descricao="Consulte os livros e solicite empréstimos."
            onPress={() => setTelaAtual('biblioteca')}
          />
          <MenuCard
            titulo="Meus Empréstimos"
            descricao="Acompanhe seus livros, vouchers e prazos."
            onPress={() => setTelaAtual('emprestimos')}
          />
          <MenuCard
            titulo="Enquetes"
            descricao="Participe das votações da escola."
            onPress={() => setTelaAtual('enquetes')}
          />
          <MenuCard
            titulo="Suporte"
            descricao="Envie dúvidas para a gestão."
            onPress={() => setTelaAtual('suporte')}
          />

          {profile?.role === 'admin' && (
            <MenuCard
              titulo="Gestão"
              descricao="Publique notícias, cadastre livros e administre o HenriNews."
              destaque
              onPress={() => setTelaAtual('gestao')}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuCard({
  titulo,
  descricao,
  destaque = false,
  onPress,
}: {
  titulo: string;
  descricao: string;
  destaque?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.menuCard, destaque && styles.menuCardDestaque]}
      onPress={onPress}
    >
      <Text style={[styles.menuTitulo, destaque && styles.menuTituloDestaque]}>
        {titulo}
      </Text>
      <Text
        style={[styles.menuDescricao, destaque && styles.menuDescricaoDestaque]}
      >
        {descricao}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: 12, color: '#64748b' },
  loginCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 20,
    elevation: 3,
  },
  logo: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#4f46e5',
    marginBottom: 30,
  },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  subtitulo: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 6,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  botaoEntrar: {
    backgroundColor: '#4f46e5',
    padding: 15,
    borderRadius: 12,
    marginTop: 6,
  },
  botaoDesativado: { opacity: 0.6 },
  botaoEntrarTexto: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  botaoRecuperar: {
    marginTop: 12,
    padding: 8,
  },
  botaoRecuperarTexto: {
    color: '#4f46e5',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  },
  botaoCadastro: {
    marginTop: 4,
    padding: 12,
  },
  botaoCadastroTexto: {
    color: '#4f46e5',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 15,
  },
  homeContainer: { flex: 1, backgroundColor: '#f8fafc' },
  homeContent: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    gap: 12,
  },
  headerTextArea: { flex: 1 },
  logoPequeno: { color: '#4f46e5', fontSize: 28, fontWeight: 'bold' },
  bemVindo: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  tipoUsuario: { color: '#64748b', fontSize: 13, marginTop: 4 },
  botaoSair: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  botaoSairTexto: { color: '#334155', fontWeight: '600' },
  secaoTitulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  menuGrid: { gap: 12 },
  menuCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  menuCardDestaque: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  menuTitulo: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  menuTituloDestaque: { color: '#ffffff' },
  menuDescricao: { color: '#64748b', fontSize: 14, marginTop: 5 },
  menuDescricaoDestaque: { color: '#e0e7ff' },
});
