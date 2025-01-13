import React, { useState, useEffect } from 'react';
import { Button, Text, TextInput, View, Platform, Linking, ScrollView, StyleSheet, ActivityIndicator, Dimensions, Alert, BackHandler } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';

// Your interfaces
interface HomePageProps {
  firstName: string;
  lastName: string;
}

interface DataItem {
  OutletUID: string;
  OutletName: string;
  MasterLatitude: number;
  MasterLongitude: number;
  isValid: boolean;
}

// Header component
const Header = ({ firstName, lastName, handleLoadExcel, loading, message, handleLogout }: { firstName: string; lastName: string; handleLoadExcel: () => void; loading: boolean; message: string; handleLogout: () => void }) => {
  const handleExit = () => {
    if (Platform.OS === 'web') {
      window.location.href = 'about:blank';
    } else if (Platform.OS === 'android') {
      Alert.alert(
        'Exit App',
        'Do you want to exit?',
        [
          { text: 'Yes', onPress: () => BackHandler.exitApp() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } else if (Platform.OS === 'ios') {
      Alert.alert("Exit App", "Use the Home button to close the app on iOS.");
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerTextContainer}>
        <Text style={styles.title}>Welcome, {firstName} {lastName}!</Text>
      </View>
      <View style={styles.headerButtonContainer}>
        <Button title="Load Excel File" onPress={handleLoadExcel} color="#d32f2f" />
        <Button title="Exit" onPress={handleExit} color="#d32f2f" />
        {loading && <ActivityIndicator size="large" color="#d32f2f" />}
        {message !== '' && <Text style={styles.message}>{message}</Text>}
      </View>
    </View>
  );
};

const Search = ({ searchQuery, setSearchQuery, handleSearch }: { searchQuery: string; setSearchQuery: (query: string) => void; handleSearch: () => void }) => (
  <View style={styles.searchSection}>
    <TextInput style={styles.input} placeholder="Search by OutletUID or OutletName" value={searchQuery} onChangeText={setSearchQuery} />
    <Button title="Search" onPress={handleSearch} color="#d32f2f" />
  </View>
);

const Results = ({ searchResults, currentPage, itemsPerPage, openInGoogleMaps, handleNextPage, handlePreviousPage }: { searchResults: DataItem[]; currentPage: number; itemsPerPage: number; openInGoogleMaps: (latitude: number, longitude: number) => void; handleNextPage: () => void; handlePreviousPage: () => void }) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResults = searchResults.slice(startIndex, endIndex);

  return (
    <View style={styles.resultsContainer}>
      {paginatedResults.map((result, index) => (
        <View key={index} style={styles.result}>
          <Text style={styles.resultText}>{result.OutletUID} - {result.OutletName}</Text>
          {result.isValid ? (
            <View style={styles.circularButtonWrapper}>
              <Button title="G" onPress={() => openInGoogleMaps(result.MasterLatitude, result.MasterLongitude)} color="#ffffff" accessibilityLabel="Open in Google Maps" />
            </View>
          ) : (
            <Text style={styles.invalidData}>Invalid Data</Text>
          )}
        </View>
      ))}
      {searchResults.length > itemsPerPage && (
        <View style={styles.pagination}>
          <Button title="Previous" onPress={handlePreviousPage} disabled={currentPage === 1} color="#d32f2f" />
          <Text style={styles.pageIndex}>{currentPage}</Text>
          <Button title="Next" onPress={handleNextPage} disabled={currentPage === Math.ceil(searchResults.length / itemsPerPage)} color="#d32f2f" />
        </View>
      )}
    </View>
  );
};

function HomeScreen({ firstName, lastName }: HomePageProps) {
  const [message, setMessage] = useState<string>('');
  const [data, setData] = useState<DataItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;
  const [containerStyle, setContainerStyle] = useState(styles.container);

  useEffect(() => {
    if (searchQuery === '') {
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    const updateLayout = () => {
      const { width, height } = Dimensions.get('window');
      setContainerStyle({
        ...styles.container,
        minHeight: '100%',
      });
    };

    const subscription = Dimensions.addEventListener('change', updateLayout);
    return () => {
      subscription?.remove();
    };
  }, []);

  const handleLoadExcel = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      console.log('DocumentPicker result:', result);
      if (result.assets && result.assets.length > 0) {
        const { uri } = result.assets[0];
        console.log('Loaded Excel file:', uri);
        const response = await fetch(uri);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target) {
            const data = new Uint8Array(e.target.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            validateAndProcessData(jsonData);
          }
        };
        reader.readAsArrayBuffer(blob);
        setMessage('File loaded successfully!');
      } else {
        setMessage('File selection canceled.');
      }
    } catch (error) {
      console.error('Error loading Excel file:', error);
      setMessage('Error loading file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateAndProcessData = (jsonData: any[]) => {
    const headers = jsonData[0];
    const requiredHeaders = ['OutletUID', 'OutletName', 'Master Latitude', 'Master Longitude'];
    // Validate headers
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    const extraHeaders: string[] = headers.filter((header: string) => !requiredHeaders.includes(header));
    if (missingHeaders.length > 0 || extraHeaders.length > 0) {
      setMessage(`Invalid headers. Missing headers: ${missingHeaders.join(', ')}. Extra headers: ${extraHeaders.join(', ')}. Expected headers: ${requiredHeaders.join(', ')}.`);
      return;
    }
    // Process data
    const processedData = jsonData.slice(1).map((row: any[]) => {
      const [OutletUID, OutletName, MasterLatitude, MasterLongitude] = row;
      const isValid = OutletUID && MasterLatitude && MasterLongitude;
      return { OutletUID, OutletName, MasterLatitude, MasterLongitude, isValid };
    });
    setData(processedData);
    setMessage('Data validated and processed successfully!');
  };

  const handleSearch = () => {
    const results = data.filter(
      (item) => item.OutletUID.toString().includes(searchQuery) || item.OutletName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(results);
    setCurrentPage(1); // Reset to first page on new search
  };

  const openInGoogleMaps = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(`geo:${latitude},${longitude}?q=${latitude},${longitude}`);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setMessage('Logged out successfully!');
    } catch (error) {
      console.error('Error during logout:', error);
      setMessage('Error during logout. Please try again.');
    }
  };

  const handleNextPage = () => {
    if (currentPage < Math.ceil(searchResults.length / itemsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <ScrollView contentContainerStyle={containerStyle}>
      <Header firstName={firstName} lastName={lastName} handleLoadExcel={handleLoadExcel} loading={loading} message={message} handleLogout={handleLogout} />
      <Search searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} />
      <Results searchResults={searchResults} currentPage={currentPage} itemsPerPage={itemsPerPage} openInGoogleMaps={openInGoogleMaps} handleNextPage={handleNextPage} handlePreviousPage={handlePreviousPage} />
    </ScrollView>
  );
};

// Enhanced styles for better UI
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    minHeight: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: 20,
    width: '100%',
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  headerTextContainer: {
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  message: {
    marginTop: 10,
    color: '#d32f2f',
  },
  searchSection: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: '#d32f2f',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    width: '100%',
  },
  circularButtonWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#d32f2f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  result: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  resultText: {
    fontSize: 18,
  },
  invalidData: {
    color: '#d32f2f',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageIndex: {
    fontSize: 18,
  },
});

export default HomeScreen;
