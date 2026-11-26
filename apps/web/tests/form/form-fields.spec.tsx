import { expect, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';
import { useForm } from 'react-hook-form';
import { FormCheckbox } from '@/components/form/form-checkbox';
import { FormCheckboxGroup } from '@/components/form/form-checkbox-group';
import { FormCombobox } from '@/components/form/form-combobox';
import { FormInput } from '@/components/form/form-input';
import { FormInputOTP } from '@/components/form/form-input-otp';
import { FormNativeSelect } from '@/components/form/form-native-select';
import { FormRadioGroup } from '@/components/form/form-radio-group';
import { FormSelect } from '@/components/form/form-select';
import { FormSlider } from '@/components/form/form-slider';
import { FormSwitch } from '@/components/form/form-switch';
import { FormTextarea } from '@/components/form/form-textarea';
import { Slider } from '@/components/ui/slider';

const options = [
  { value: 'one', label: 'First' },
  { value: 'two', label: 'Second' },
];

test('form controls render with their labels and configured defaults', () => {
  function Example() {
    const form = useForm({
      defaultValues: {
        text: 'initial',
        notes: '',
        otp: '',
        checked: false,
        enabled: true,
        choices: ['one'],
        radio: 'one',
        select: 'one',
        native: 'two',
        combo: 'two',
        amount: 25,
      },
    });
    return (
      <>
        <FormInput control={form.control} name="text" label="Text" description="Helpful text" />
        <FormTextarea control={form.control} name="notes" label="Notes" />
        <FormInputOTP control={form.control} name="otp" label="Code" maxLength={4} />
        <FormCheckbox control={form.control} name="checked" label="Agree" />
        <FormSwitch control={form.control} name="enabled" label="Enabled" />
        <FormCheckboxGroup
          control={form.control}
          name="choices"
          label="Choices"
          options={options}
        />
        <FormRadioGroup control={form.control} name="radio" label="Radio" options={options} />
        <FormSelect
          control={form.control}
          name="select"
          label="Select"
          options={options}
          placeholder="Choose"
        />
        <FormNativeSelect
          control={form.control}
          name="native"
          label="Native select"
          options={options}
          placeholder="Choose"
        />
        <FormCombobox
          control={form.control}
          name="combo"
          label="Combobox"
          options={options}
          placeholder="Choose"
          emptyMessage="No matches"
        />
        <FormSlider control={form.control} name="amount" label="Amount" />
      </>
    );
  }

  const html = renderToStaticMarkup(<Example />);
  expect(html).toContain('value="initial"');
  expect(html).toContain('Helpful text');
  expect(html).toContain('aria-describedby=');
  expect(html).toContain('role="radiogroup"');
  expect(html).toContain('role="group"');
  expect(html).toContain('Native select');
  expect(html).toContain('Combobox');
  expect(html).toContain('Amount');
});

test('slider renders one thumb for a scalar and two for a range', () => {
  const single = renderToStaticMarkup(<Slider value={25} />);
  const range = renderToStaticMarkup(<Slider value={[25, 75]} />);
  expect(single.match(/data-slot="slider-thumb"/g)).toHaveLength(1);
  expect(range.match(/data-slot="slider-thumb"/g)).toHaveLength(2);
});
