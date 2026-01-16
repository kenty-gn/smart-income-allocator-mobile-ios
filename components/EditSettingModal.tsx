import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface EditSettingModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  title: string;
  label: string;
  initialValue: string;
  keyboardType?: 'default' | 'numeric';
  prefix?: string;
  suffix?: string;
}

export default function EditSettingModal({
  visible,
  onClose,
  onSave,
  title,
  label,
  initialValue,
  keyboardType = 'default',
  prefix,
  suffix,
}: EditSettingModalProps) {
  const [value, setValue] = useState(initialValue);

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>キャンセル</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={{ width: 70 }} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.label}>{label}</Text>
          <View style={styles.inputContainer}>
            {prefix && <Text style={styles.prefix}>{prefix}</Text>}
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={setValue}
              keyboardType={keyboardType}
              autoFocus
              selectTextOnFocus
            />
            {suffix && <Text style={styles.suffix}>{suffix}</Text>}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <LinearGradient colors={['#10b981', '#14b8a6']} style={styles.saveGradient}>
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text style={styles.saveText}>保存</Text>
          </LinearGradient>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: 'white',
  },
  cancelButton: {
    fontSize: 16,
    color: '#64748b',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  prefix: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0f172a',
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#0f172a',
  },
  suffix: {
    fontSize: 18,
    color: '#64748b',
    marginLeft: 4,
  },
  saveButton: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
});
