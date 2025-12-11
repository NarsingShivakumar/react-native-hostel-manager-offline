import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { database } from '../../database';
import { Q } from '@nozbe/watermelondb';
import withObservables from '@nozbe/with-observables';
import GuestCard from '../../components/GuestCard';
import SearchBar from '../../components/SearchBar';
import Ionicons from '@react-native-vector-icons/ionicons';

function GuestListScreen({ navigation, guests }) {
  const [filteredGuests, setFilteredGuests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, inactive, overdue

  useEffect(() => {
    applyFilters();
  }, [guests, searchQuery, filter]);

  const applyFilters = () => {
    let filtered = [...guests];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        g =>
          g.firstName.toLowerCase().includes(query) ||
          g.lastName.toLowerCase().includes(query) ||
          g.mobileNumber.includes(query) ||
          g.roomNumber.toLowerCase().includes(query)
      );
    }

    // Apply filter
    switch (filter) {
      case 'active':
        filtered = filtered.filter(g => g.isActive);
        break;
      case 'inactive':
        filtered = filtered.filter(g => !g.isActive);
        break;
      case 'overdue':
        filtered = filtered.filter(g => g.isActive && g.isPaymentOverdue);
        break;
    }

    setFilteredGuests(filtered);
  };

  const handleGuestPress = (guest) => {
    navigation.navigate('GuestDetails', {
      guestId: guest.id,
      guestName: guest.fullName,
    });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search guests..."
      />
      <View style={styles.filterContainer}>
        <FilterButton
          label="All"
          active={filter === 'all'}
          count={guests.length}
          onPress={() => setFilter('all')}
        />
        <FilterButton
          label="Active"
          active={filter === 'active'}
          count={guests.filter(g => g.isActive).length}
          onPress={() => setFilter('active')}
        />
        <FilterButton
          label="Overdue"
          active={filter === 'overdue'}
          count={guests.filter(g => g.isActive && g.isPaymentOverdue).length}
          onPress={() => setFilter('overdue')}
          color="#f44336"
        />
        <FilterButton
          label="Inactive"
          active={filter === 'inactive'}
          count={guests.filter(g => !g.isActive).length}
          onPress={() => setFilter('inactive')}
        />
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>No guests found</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddGuest')}>
        <Text style={styles.addButtonText}>Add Your First Guest</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredGuests}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <GuestCard guest={item} onPress={() => handleGuestPress(item)} />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={filteredGuests.length === 0 ? styles.emptyList : { padding: 16 }}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddGuest')}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const FilterButton = ({ label, active, count, onPress, color = '#6200ee' }) => (
  <TouchableOpacity
    style={[
      styles.filterButton,
      active && { backgroundColor: color, borderColor: color },
    ]}
    onPress={onPress}>
    <Text style={[styles.filterLabel, active && { color: '#fff' }]}>
      {label}
    </Text>
    <Text style={[styles.filterCount, active && { color: '#fff' }]}>
      {count}
    </Text>
  </TouchableOpacity>
);

// ✅ Make it reactive with withObservables
const enhance = withObservables([], () => ({
  guests: database.get('guests')
    .query(Q.sortBy('created_at', Q.desc))
    .observe(),
}));

export default enhance(GuestListScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6200ee',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6200ee',
  },
  filterCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6200ee',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
  addButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#6200ee',
    borderRadius: 24,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});
