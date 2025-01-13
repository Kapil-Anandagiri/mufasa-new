import React, { useState, useEffect } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, Alert, Switch, ActivityIndicator } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import chocolate from '../../assets/images/chocolate.jpg';
import GoogleIcon from '../../assets/images/GoogleIcon.png';

WebBrowser.maybeCompleteAuthSession();

type RootStackParamList = { Login: undefined; Home: undefined; };
type Props = StackScreenProps<RootStackParamList, 'Login'>;

function LoginScreen({ navigation }: Props) {
  const [isGoogleAuthEnabled, setIsGoogleAuthEnabled] = useState(false);
  const [loading, setLoading] = useState(false); // New state for loading
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '65599783978-3jh8hn57fubqakb47uruhqee1d5lgr9o.apps.googleusercontent.com',
    redirectUri: 'http://localhost:8081/auth/google/callback',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      console.log('Authentication successful:', authentication);
      Alert.alert('Login Successful', 'You have successfully logged in with Google!');
      navigation.replace('Home');
    } else if (response?.type === 'error') {
      console.error('Authentication error:', response?.error);
      Alert.alert('Login Failed', 'Failed to log in with Google.');
    }
    setLoading(false);
  }, [response]);

  const handleLogin = () => {
    setLoading(true);
    if (isGoogleAuthEnabled) {
      promptAsync();
    } else {
      navigation.replace('Home');
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={chocolate}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.topRight}>
        <Text style={styles.requestText}>
          Imayam Enterprise requests your Google credentials for login.
        </Text>
        <Switch
          value={isGoogleAuthEnabled}
          onValueChange={setIsGoogleAuthEnabled}
        />
        <TouchableOpacity onPress={handleLogin} disabled={!request && isGoogleAuthEnabled}>
          <Image source={GoogleIcon} style={styles.googleIcon} />
        </TouchableOpacity>
      </View>
      {loading && <ActivityIndicator style={styles.loadingIndicator} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  topRight: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%'
  },
  requestText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
    fontFamily: 'sans-serif',
    textAlign: 'right',
  },
  googleIcon: {
    width: 50,
    height: 50,
    marginLeft: 10,
  },
  loadingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
  },
});

export default LoginScreen;
