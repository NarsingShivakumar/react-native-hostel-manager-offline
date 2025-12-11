import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  pick,
  types,
  isCancel,
  // isInProgress, // you can import this if you want to handle that case too
} from '@react-native-documents/picker';
// import DocumentPicker from 'react-native-document-picker';
import ExportService from '../../services/ExportService';
import ImportService from '../../services/ImportService';
import Ionicons from '@react-native-vector-icons/ionicons';

export default function ExportImportScreen({ navigation }) {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const result = await ExportService.exportToCSV();

      if (result.success) {
        Alert.alert(
          'Export Successful',
          'Data has been exported successfully. You can share it now.'
        );
      } else {
        Alert.alert('Export Failed', result.error);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleExportJSON = async () => {
    setExporting(true);
    try {
      const result = await ExportService.exportToJSON();

      if (result.success) {
        Alert.alert(
          'Export Successful',
          'Data has been exported successfully. You can share it now.'
        );
      } else {
        Alert.alert('Export Failed', result.error);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    try {
      // New API: pick() returns an array of files
      const [file] = await pick({
        // keep behaviour similar to before; you can tighten this to types.plainText / custom mime if you want
        types: [types.allFiles],
      });

      if (!file) {
        return;
      }

      Alert.alert(
        'Import Data',
        'This will replace all existing data. Are you sure you want to continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            style: 'destructive',
            onPress: async () => {
              setImporting(true);
              try {
                const importResult = await ImportService.importFromJSON(file.uri);

                if (importResult.success) {
                  Alert.alert('Success', importResult.message, [
                    { text: 'OK', onPress: () => navigation.goBack() },
                  ]);
                } else {
                  Alert.alert('Import Failed', importResult.error);
                }
              } catch (error) {
                console.error('Import error:', error);
                Alert.alert('Error', 'Failed to import data');
              } finally {
                setImporting(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      if (!isCancel(error)) {
        console.error('Document picker error:', error);
        Alert.alert('Error', 'Failed to pick file');
      }
    }
  };
  return (
    <ScrollView style={styles.container}>
      {/* Export Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="cloud-upload-outline" size={32} color="#6200ee" />
          <Text style={styles.sectionTitle}>Export Data</Text>
        </View>

        <Text style={styles.sectionDescription}>
          Export all your data including guests, payments, and guardians to a file.
          You can use this file to backup or transfer your data.
        </Text>

        <TouchableOpacity
          style={[styles.exportButton, exporting && styles.buttonDisabled]}
          onPress={handleExportCSV}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="document-text-outline" size={24} color="#fff" />
              <Text style={styles.buttonText}>Export as CSV</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.exportButton, exporting && styles.buttonDisabled]}
          onPress={handleExportJSON}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="code-slash-outline" size={24} color="#fff" />
              <Text style={styles.buttonText}>Export as JSON</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Import Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="cloud-download-outline" size={32} color="#ff9800" />
          <Text style={styles.sectionTitle}>Import Data</Text>
        </View>

        <Text style={styles.sectionDescription}>
          Import data from a previously exported JSON file. This will replace all
          existing data in the app.
        </Text>

        <View style={styles.warningBox}>
          <Ionicons name="alert" size={24} color="#f44336" />
          <Text style={styles.warningText}>
            Warning: Importing will replace all current data. Make sure to export
            current data first if you want to keep it.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.importButton, importing && styles.buttonDisabled]}
          onPress={handleImport}
          disabled={importing}
        >
          {importing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="folder-open-outline" size={24} color="#fff" />
              <Text style={styles.buttonText}>Select File to Import</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Info Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="information" size={32} color="#2196f3" />
          <Text style={styles.sectionTitle}>Information</Text>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#4caf50" />
          <Text style={styles.infoText}>CSV format is compatible with Excel</Text>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#4caf50" />
          <Text style={styles.infoText}>
            JSON format preserves all data relationships
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#4caf50" />
          <Text style={styles.infoText}>
            Exported files can be stored in cloud storage
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#4caf50" />
          <Text style={styles.infoText}>
            Regular backups are recommended
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  exportButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6200ee',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  importButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff9800',
    paddingVertical: 16,
    borderRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#d32f2f',
    lineHeight: 18,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});
