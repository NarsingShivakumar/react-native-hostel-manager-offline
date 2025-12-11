import Ionicons from '@react-native-vector-icons/ionicons';
import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

export default function SearchBar({ value, onChangeText, placeholder }) {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={24} color="#999" />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || 'Search...'}
        placeholderTextColor="#999"
      />
      {value?.length > 0 && (
        <Ionicons 
          name="close-circle" 
          size={20} 
          color="#999" 
          onPress={() => onChangeText('')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
});
