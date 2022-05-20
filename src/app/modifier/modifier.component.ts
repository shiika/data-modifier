import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PointerService } from '../services/pointer.service';

@Component({
  selector: 'app-modifier',
  templateUrl: './modifier.component.html',
  styleUrls: ['./modifier.component.scss'],
})
export class ModifierComponent implements OnInit {
  @Input() item: { key: string; value: string } = {
    key: '',
    value: '',
  };
  @Input() position: { top: string; left: string };
  form: FormGroup = this.fb.group({});
  @Output() onClose: EventEmitter<any> = new EventEmitter<any>();
  @Output() onSave: EventEmitter<any> = new EventEmitter<string>();
  constructor(private fb: FormBuilder, private pointer: PointerService) {}

  ngOnInit(): void {
    this.form.addControl(this.item.key, this.fb.control(this.item.value));
  }

  close(): void {
    this.onClose.emit(false);
    this.pointer.$itemPointEmitter.next(null);
    this.pointer.$navItemIndex = undefined;
  }

  save(): void {
    this.onSave.emit(this.form.get(this.item.key).value);
    this.close();
  }
}
